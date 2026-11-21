// Сетка слотов из спецификации §4 (docs/spec/calendar.md): старты выровнены
// от 09:00 с шагом 30 минут, встреча всегда заканчивается не позже 18:00.
import { type Interval } from '@repo/interval'
import { SLOT_STEP_MINUTES, WORKDAY_END_HOUR, WORKDAY_START_HOUR } from '../config/calendar'
import { moscowInstantAt } from './moscow-time'

// Слот — интервал-кандидат (GLOSSARY): локальный SlotInterval заменён
// пакетным Interval — структуры совпадают, отдельный тип не нужен.

/**
 * Старты дня d для типа встречи длительностью m: t = 09:00, пока
 * t + m <= 18:00, шаг 30 минут (спецификация §4). Для типа, не влезающего
 * в рабочий день, слотов нет — пустой день не ошибка.
 */
export function buildDayGrid(date: string, durationMinutes: number): Interval[] {
  const workdayStart = moscowInstantAt(date, WORKDAY_START_HOUR, 0).getTime()
  const workdayEnd = moscowInstantAt(date, WORKDAY_END_HOUR, 0).getTime()
  const slots: Interval[] = []
  for (
    let start = workdayStart;
    start + durationMinutes * 60_000 <= workdayEnd;
    start += SLOT_STEP_MINUTES * 60_000
  ) {
    slots.push({ start: new Date(start), end: new Date(start + durationMinutes * 60_000) })
  }
  return slots
}
