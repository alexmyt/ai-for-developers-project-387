// Чистая логика брони: порядок проверок §8, окно записи, сетка и пересечения
// (спецификация §4, §5, §8, docs/spec/calendar.md). Текущее время передаётся
// снаружи через Clock (ADR-0003), поэтому функции детерминированы.
import { BOOKING_WINDOW_DAYS } from '../config/calendar'
import type { MeetingType } from '../meeting-types/meeting-type'
import { addDays, moscowDateString } from './moscow-time'
import { buildDayGrid } from './slot-grid'

/** Интервал-кандидат: проверяемая бронь или существующая бронь (§5). */
export interface Interval {
  /** Полуоткрытый интервал [start, end): касание границами — не конфликт. */
  start: Date
  end: Date
}

/**
 * Пересечение полуоткрытых интервалов: a.start < b.end && b.start < a.end.
 * Касание границами конфликтом не считается, частичное наложение любых
 * типов встреч запрещено (спецификация §5).
 */
export function intervalsIntersect(a: Interval, b: Interval): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()
}

/**
 * Старт строго после текущего момента (спецификация §4, §8): единственный
 * предикат границы — и для окна записи брони, и для скрытия прошедших
 * слотов занятости. Старт, совпадающий с «сейчас», будущим не считается.
 */
export function isFutureStart(input: { start: Date; now: Date }): boolean {
  return input.start.getTime() > input.now.getTime()
}

/**
 * Старт внутри окна записи (спецификация §8): start > now, а московская дата
 * старта — не дальше 13-го дня от сегодняшней. Границы окна проверяются
 * по московской дате, а не по UTC (спецификация §3).
 */
function isStartInWindow(input: { start: Date; now: Date }): boolean {
  const lastWindowDay = addDays(moscowDateString(input.now), BOOKING_WINDOW_DAYS - 1)
  return isFutureStart(input) && moscowDateString(input.start) <= lastWindowDay
}

/**
 * Старт на сетке дня (спецификация §4): 09:00–18:00 по Москве с шагом
 * 30 минут, и встреча успевает закончиться до 18:00. Проверка повторно
 * использует построение сетки дня: старт валиден, если он совпадает
 * с одним из стартов сетки.
 */
function isStartOnGrid(input: { start: Date; durationMinutes: number }): boolean {
  const date = moscowDateString(input.start)
  return buildDayGrid(date, input.durationMinutes).some(
    (slot) => slot.start.getTime() === input.start.getTime(),
  )
}

/**
 * Конец брони: старт плюс длительность типа встречи. end вычисляет сервер,
 * поэтому клиент не может подделать интервал (спецификация §8, ADR-0003).
 */
export function bookingEnd(meetingType: Pick<MeetingType, 'durationMinutes'>, start: Date): Date {
  return new Date(start.getTime() + meetingType.durationMinutes * 60_000)
}

/** Код нарушения правил брони: имена совпадают с кодами ошибок §8. */
export type BookingViolation = 'slot_out_of_window' | 'slot_out_of_grid' | 'slot_taken'

/**
 * Правила брони в фиксированном порядке спецификации §8: окно записи → сетка
 * → пересечения. Возвращает код первого нарушения или null, если бронировать
 * можно. Проверка пересечений идёт последней, чтобы вызывающая сторона
 * выполняла всю функцию внутри критической секции мьютекса.
 */
export function validateBookingRules(input: {
  meetingType: MeetingType
  start: Date
  now: Date
  /** Существующие брони всех типов встреч: пересечения считаются по всем (§5). */
  bookings: readonly Interval[]
}): BookingViolation | null {
  if (!isStartInWindow({ start: input.start, now: input.now })) {
    return 'slot_out_of_window'
  }
  if (!isStartOnGrid({ start: input.start, durationMinutes: input.meetingType.durationMinutes })) {
    return 'slot_out_of_grid'
  }
  const end = bookingEnd(input.meetingType, input.start)
  const candidate: Interval = { start: input.start, end }
  if (input.bookings.some((booking) => intervalsIntersect(candidate, booking))) {
    return 'slot_taken'
  }
  return null
}
