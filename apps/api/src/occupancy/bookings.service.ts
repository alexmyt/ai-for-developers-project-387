import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Mutex } from 'async-mutex'
import { randomUUID } from 'node:crypto'
import { moscowDateString } from './moscow-time'
import { Clock } from '../clock/clock'
import { MeetingTypesService } from '../meeting-types/meeting-types.service'
import type { Booking } from './booking'
import { toBookingJson, type BookingJson } from './booking-json'
import { bookingEnd, validateBookingRules, type BookingViolation } from './booking.domain'
import { validateCreateBookingRequest } from './booking-validation'

/**
 * Код нарушения правил → типизированная HTTP-ошибка §8: единственное место,
 * где знают коды ответов создания брони.
 */
function httpErrorFor(violation: BookingViolation): HttpException {
  switch (violation) {
    case 'slot_out_of_window':
      return new HttpException(
        {
          code: 'slot_out_of_window',
          message: 'Старт уже наступил или находится за пределами окна записи на 14 дней',
        },
        HttpStatus.BAD_REQUEST,
      )
    case 'slot_out_of_grid':
      return new HttpException(
        {
          code: 'slot_out_of_grid',
          message:
            'Старт должен быть на сетке 09:00–18:00 по Москве с шагом 30 минут, и встреча должна заканчиваться до 18:00',
        },
        HttpStatus.BAD_REQUEST,
      )
    case 'slot_taken':
      return new HttpException(
        {
          code: 'slot_taken',
          message: 'Это время только что заняли. Выберите другой слот',
        },
        HttpStatus.CONFLICT,
      )
  }
}

// Хранилище броней в памяти процесса (ADR-0003). Проверка пересечений
// и вставка выполняются внутри критической секции мьютекса по дате слота:
// разные дни не блокируют друг друга.
@Injectable()
export class BookingsService {
  private readonly items: Booking[] = []

  private readonly dateMutexes = new Map<string, Mutex>()

  constructor(
    private readonly clock: Clock,
    private readonly meetingTypesService: MeetingTypesService,
  ) {}

  /**
   * Все брони: пересечения считаются по всем типам встреч сразу (§5).
   * Список отдаётся как readonly: живой массив не утекает наружу.
   */
  list(): readonly Booking[] {
    return this.items
  }

  /**
   * Предстоящие брони владельца (спецификация §9): старт не раньше текущего
   * момента, все типы в одном списке, по возрастанию start, без пагинации.
   */
  listUpcoming(): BookingJson[] {
    const now = this.clock.now()
    return this.items
      .filter((booking) => booking.start.getTime() >= now.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map(toBookingJson)
  }

  /**
   * Бронь свободного слота (спецификация §8). Порядок проверок живёт в чистом
   * модуле правил: форма и поля → существование типа → окно записи → сетка →
   * пересечения. Весь вызов правил и маппинг кода нарушения в HTTP-ошибку —
   * внутри критической секции мьютекса. Полуоткрытые интервалы делают касание
   * границами допустимым.
   */
  async create(request: unknown): Promise<BookingJson> {
    const input = validateCreateBookingRequest(request)

    const meetingType = this.meetingTypesService.getOrFail(input.meetingTypeId)
    const now = this.clock.now()

    return this.inDateMutex(moscowDateString(input.start), () => {
      const violation = validateBookingRules({
        meetingType,
        start: input.start,
        now,
        bookings: this.items,
      })
      if (violation) {
        throw httpErrorFor(violation)
      }

      const booking: Booking = {
        id: randomUUID(),
        meetingTypeId: meetingType.id,
        meetingTypeTitle: meetingType.title,
        start: input.start,
        end: bookingEnd(meetingType, input.start),
        guestName: input.name,
        guestEmail: input.email,
        createdAt: now,
      }
      this.items.push(booking)
      return toBookingJson(booking)
    })
  }

  /** Мьютекс на календарный день по Москве: на каждый день — свой (ADR-0003). */
  private inDateMutex<T>(date: string, action: () => T): Promise<T> {
    let mutex = this.dateMutexes.get(date)
    if (!mutex) {
      mutex = new Mutex()
      this.dateMutexes.set(date, mutex)
    }
    // Колбэк синхронный: между проверкой пересечений и вставкой нет
    // await, поэтому конкуренты не вклиниваются (ADR-0003).
    return mutex.runExclusive(action)
  }
}
