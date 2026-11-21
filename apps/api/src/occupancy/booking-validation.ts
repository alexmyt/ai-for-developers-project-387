import type { FieldMessages } from '../validation/request-schema'
import { assertRequestBodyMatchesSchema } from '../validation/request-schema'
import { requireJsonObject, validationError } from '../validation/validation'

/** Нормализованные поля запроса на бронирование. */
export interface CreateBookingInput {
  meetingTypeId: string
  start: Date
  name: string
  email: string
}

// Формат utcDateTime из контракта: UTC-инстант в ISO 8601 с Z
// (спецификация §3). Дробные секунды допустимы.
const ISO_INSTANT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/

/** Сообщение ручной проверки ISO-формата и существования даты start (§8). */
const START_NOT_INSTANT_MESSAGE = 'Поле start должно быть UTC-инстантом в формате ISO 8601 с Z'

/**
 * Разбирает ISO-инстант с проверкой компонентов: JS перекатывает
 * несуществующие даты (31 ноября превращается в 1 декабря), поэтому
 * «2026-11-31T07:00:00Z» не должен пройти как валидный момент.
 */
function parseIsoInstant(value: string): Date | null {
  const match = ISO_INSTANT_PATTERN.exec(value)
  if (!match) {
    return null
  }
  // Группы регулярки гарантируют шесть чисел; Number() терпит undefined.
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const monthIndex = month - 1
  // Число дней в месяце: день 0 следующего месяца — последний день текущего.
  const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const componentsExist =
    day >= 1 && day <= lastDayOfMonth && hour <= 23 && minute <= 59 && second <= 59
  const instant = new Date(value)
  if (!componentsExist || Number.isNaN(instant.getTime())) {
    return null
  }
  return instant
}

// Сообщения нарушений схемы контракта (спецификация §8). Лимиты длины и
// шаблон email исполняются из openapi.json, здесь только тексты; числа в
// текстах — значения контракта. Порядок полей — порядок проверок §8,
// порядок ключей — приоритет внутри поля; ручная проверка ISO-формата
// start идёт после типа start и раньше полей name и email.
export const FIELD_MESSAGES: FieldMessages[] = [
  {
    field: 'meetingTypeId',
    messages: {
      required: 'Поле meetingTypeId обязательно',
      type: 'Поле meetingTypeId должно быть строкой',
    },
  },
  {
    field: 'start',
    messages: {
      required: 'Поле start обязательно',
      type: 'Поле start должно быть строкой',
      manual: START_NOT_INSTANT_MESSAGE,
    },
    // Формат date-time схемой сознательно не исполняется (ajv без
    // validateFormats), а существование даты схемой не выражается:
    // разбор с проверкой компонентов возвращает null для обоих случаев.
    manual: (body) => {
      const start = (body as Record<string, unknown>).start
      return typeof start === 'string' && parseIsoInstant(start) === null
    },
  },
  {
    field: 'name',
    messages: {
      required: 'Поле name обязательно',
      type: 'Поле name должно быть строкой',
      minLength: 'Поле name должно быть от 1 до 100 символов',
      maxLength: 'Поле name должно быть от 1 до 100 символов',
    },
  },
  {
    field: 'email',
    messages: {
      required: 'Поле email обязательно',
      type: 'Поле email должно быть строкой',
      maxLength: 'Поле email должно быть не длиннее 254 символов',
      pattern: 'Поле email должно содержать «@» и точку в домене и не должно содержать пробелов',
    },
  },
]

/**
 * Проверяет форму и поля запроса на бронирование (спецификация §8) и
 * нормализует их: name обрезается. Нарушение — 400 validation_error.
 */
export function validateCreateBookingRequest(request: unknown): CreateBookingInput {
  const body = requireJsonObject(request)

  // Нормализация до исполнения схемы: контрактные лимиты применяются к
  // тримированному значению, пробельная строка после trim пуста и отклоняется
  // minLength схемы (спецификация §8).
  const name = typeof body.name === 'string' ? body.name.trim() : body.name

  // Схема контракта исполняется первой: нарушение лимитов и шаблонов
  // отклоняется до любой бизнес-логики. Формат date-time схемой сознательно
  // не исполняется — его нарушение проверяет ручное правило из FIELD_MESSAGES
  // на своём месте порядка §8 (после типа start, раньше name и email).
  assertRequestBodyMatchesSchema('post', '/api/bookings', { ...body, name }, FIELD_MESSAGES)

  const startInstant = parseIsoInstant(body.start as string)
  if (!startInstant) {
    // Недостижимо после схемы и ручной проверки выше — защита инварианта.
    throw validationError(START_NOT_INSTANT_MESSAGE)
  }

  // Схема гарантирует, что поля — строки; приведение фиксирует этот инвариант.
  return {
    meetingTypeId: body.meetingTypeId as string,
    start: startInstant,
    name: name as string,
    email: body.email as string,
  }
}
