// Чистый модуль правил брони: порядок проверок §8, окно записи, сетка,
// пересечения и предикат границы (спецификация §4, §5, §8, §13.1,
// docs/spec/calendar.md). Время передаётся снаружи, поэтому тесты
// детерминированы и не зависят от даты запуска.
import { describe, expect, it } from 'vitest'
import { isFutureStart, validateBookingRules } from '../src/occupancy/booking.domain'
// Тип Интервала теперь живёт в пакете @repo/interval (тикет #5).
import type { Interval } from '@repo/interval'

// 12:15 по Москве 11 ноября — «сейчас» для всех проверок окна.
const FIXED_NOW = new Date('2026-11-11T09:15:00Z')

// Свободный слот 10:00–10:30 по Москве 12 ноября (пример §3): проходит
// окно и сетку, а существующих броней нет.
const MEETING_TYPE = { id: 'intro', title: 'Знакомство', description: null, durationMinutes: 30 }

function violationFor(
  overrides: Partial<{
    start: Date
    now: Date
    bookings: Interval[]
    durationMinutes: number
  }>,
): string | null {
  return validateBookingRules({
    meetingType: { ...MEETING_TYPE, durationMinutes: overrides.durationMinutes ?? 30 },
    start: overrides.start ?? new Date('2026-11-12T07:00:00Z'),
    now: overrides.now ?? FIXED_NOW,
    bookings: overrides.bookings ?? [],
  })
}

// Порядок проверок из спецификации §8 — от него зависят коды ответов.
describe('проверки брони в порядке §8', () => {
  // Окно записи из спецификации §2: сегодня + 13 следующих дней,
  // то есть с 11 по 24 ноября 2026 включительно.
  describe('окно записи', () => {
    it('принимает старт на сетке завтрашнего дня', () => {
      // 10:00 по Москве 12 ноября — 07:00 UTC.
      expect(violationFor({ start: new Date('2026-11-12T07:00:00Z') })).toBeNull()
    })

    it('отклоняет старт, который уже наступил', () => {
      // 12:00 по Москве 11 ноября: раньше фиксированного «сейчас» (12:15).
      expect(violationFor({ start: new Date('2026-11-11T09:00:00Z') })).toBe('slot_out_of_window')
    })

    it('принимает последний слот 14-го дня окна: 17:30 по Москве 24 ноября', () => {
      expect(violationFor({ start: new Date('2026-11-24T14:30:00Z') })).toBeNull()
    })

    it('отклоняет старт 15-го дня: окно кончается 24 ноября', () => {
      // 09:00 по Москве 25 ноября — уже за границей окна.
      expect(violationFor({ start: new Date('2026-11-25T06:00:00Z') })).toBe('slot_out_of_window')
    })

    it('границу окна проверяет по московской дате, а не по UTC', () => {
      // Старт 17:30 по Москве 24 ноября — последний слот сетки. Одна секунда
      // «сейчас» переносит полночь по Москве (21:00 UTC, спецификация §3):
      // 24-е попадает в окно по московской дате, хотя UTC-дата «сейчас»
      // в обоих случаях одна и та же — 10 ноября.
      const start = new Date('2026-11-24T14:30:00Z')
      expect(violationFor({ start, now: new Date('2026-11-10T20:59:59Z') })).toBe(
        'slot_out_of_window',
      )
      expect(violationFor({ start, now: new Date('2026-11-10T21:00:00Z') })).toBeNull()
    })
  })

  // Сетка слотов из спецификации §4: 09:00–18:00 по Москве, шаг 30 минут,
  // встреча должна закончиться не позже 18:00.
  describe('сетка', () => {
    it('принимает выровненный старт внутри рабочего дня', () => {
      expect(violationFor({ start: new Date('2026-11-12T07:00:00Z') })).toBeNull()
    })

    it('принимает последний старт для 30 минут — 17:30', () => {
      expect(violationFor({ start: new Date('2026-11-12T14:30:00Z') })).toBeNull()
    })

    it('принимает последний старт для 60 минут — 17:00', () => {
      expect(
        violationFor({ start: new Date('2026-11-12T14:00:00Z'), durationMinutes: 60 }),
      ).toBeNull()
    })

    it.each([
      { name: 'старт между шагами сетки (10:10)', start: '2026-11-12T07:10:00Z', duration: 30 },
      { name: 'старт раньше 09:00 по Москве (07:00)', start: '2026-11-12T04:00:00Z', duration: 30 },
      { name: 'старт ровно в 18:00 по Москве', start: '2026-11-12T15:00:00Z', duration: 30 },
      { name: 'секунды не нулевые (10:00:30)', start: '2026-11-12T07:00:30Z', duration: 30 },
      {
        name: 'встреча на 60 минут не влезает до 18:00 (17:30)',
        start: '2026-11-12T14:30:00Z',
        duration: 60,
      },
    ])('отклоняет случай: $name', ({ start, duration }) => {
      expect(violationFor({ start: new Date(start), durationMinutes: duration })).toBe(
        'slot_out_of_grid',
      )
    })
  })

  // Пересечения из спецификации §5: любые наложения запрещены, касание
  // границами допустимо.
  describe('пересечения', () => {
    it('пересечение с существующей бронью — slot_taken', () => {
      // Существующая бронь 10:00–11:00 по Москве; кандидат 10:30–11:00 (§5).
      const bookings: Interval[] = [
        { start: new Date('2026-11-12T07:00:00Z'), end: new Date('2026-11-12T08:00:00Z') },
      ]
      expect(violationFor({ start: new Date('2026-11-12T07:30:00Z'), bookings })).toBe('slot_taken')
    })

    it('касание границами конфликтом не считает — нарушений нет', () => {
      // Бронь 10:00–10:30, кандидат 10:30–11:00: полуоткрытые интервалы (§5).
      const bookings: Interval[] = [
        { start: new Date('2026-11-12T07:00:00Z'), end: new Date('2026-11-12T07:30:00Z') },
      ]
      expect(violationFor({ start: new Date('2026-11-12T07:30:00Z'), bookings })).toBeNull()
    })
  })

  it('окно записи раньше сетки: у нарушенного и окна, и сетки побеждает окно', () => {
    // 07:10 по Москве 10 ноября: старт в прошлом И не на сетке (§8).
    expect(violationFor({ start: new Date('2026-11-10T04:10:00Z') })).toBe('slot_out_of_window')
  })

  it('сетка раньше пересечений: у нарушенной и сетки, и свободы слота побеждает сетка', () => {
    // Бронь 10:00–10:30, кандидат 10:10: не на сетке И пересекается (§8).
    const bookings: Interval[] = [
      { start: new Date('2026-11-12T07:00:00Z'), end: new Date('2026-11-12T07:30:00Z') },
    ]
    expect(violationFor({ start: new Date('2026-11-12T07:10:00Z'), bookings })).toBe(
      'slot_out_of_grid',
    )
  })

  it('валидный свободный слот — нарушений нет', () => {
    expect(violationFor({})).toBeNull()
  })
})

// Граница «start строго после now» (спецификация §4, §8): один предикат
// для окна записи и для скрытия прошедших слотов.
describe('предикат границы «старт строго после now»', () => {
  it('принимает старт позже текущего момента', () => {
    expect(isFutureStart({ start: new Date('2026-11-11T09:16:00Z'), now: FIXED_NOW })).toBe(true)
  })

  it('отклоняет старт, начинающийся ровно сейчас', () => {
    expect(isFutureStart({ start: FIXED_NOW, now: FIXED_NOW })).toBe(false)
  })

  it('отклоняет старт, который уже наступил', () => {
    expect(isFutureStart({ start: new Date('2026-11-11T09:14:59Z'), now: FIXED_NOW })).toBe(false)
  })
})

// Матрица пересечений (§5, §13.1) покрыта тестами пакета @repo/interval:
// здесь остаются только проверки через публичный шов validateBookingRules.
