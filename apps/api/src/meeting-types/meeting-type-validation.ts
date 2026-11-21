import type { FieldMessages } from '../validation/request-schema'
import { assertRequestBodyMatchesSchema } from '../validation/request-schema'
import { requireJsonObject } from '../validation/validation'

/** Нормализованные поля запроса на создание типа встречи. */
export interface CreateMeetingTypeInput {
  id: string
  title: string
  description: string | null
  durationMinutes: number
}

// Сообщения нарушений схемы контракта (спецификация §6). Лимиты, шаблон id
// и границы с шагом длительности исполняются из openapi.json, здесь только
// тексты; числа в текстах — значения контракта. Порядок полей — порядок
// проверок §6.1, порядок ключей — приоритет внутри поля.
const FIELD_MESSAGES: FieldMessages[] = [
  {
    field: 'id',
    messages: {
      required: 'Поле id обязательно',
      type: 'Поле id должно быть строкой',
      maxLength: 'Поле id должно быть не длиннее 50 символов',
      // Минимальная длина выводится из шаблона: пустая строка нарушает и его,
      // текст — прежний, про шаблон.
      minLength: 'Поле id должно состоять из строчных латинских букв, цифр и дефисов между ними',
      pattern: 'Поле id должно состоять из строчных латинских букв, цифр и дефисов между ними',
    },
  },
  {
    field: 'title',
    messages: {
      required: 'Поле title обязательно',
      type: 'Поле title должно быть строкой',
      minLength: 'Поле title должно быть от 1 до 100 символов',
      maxLength: 'Поле title должно быть от 1 до 100 символов',
    },
  },
  {
    field: 'description',
    messages: {
      type: 'Поле description должно быть строкой или null',
      maxLength: 'Поле description должно быть не длиннее 500 символов',
    },
  },
  {
    field: 'durationMinutes',
    messages: {
      required: 'Поле durationMinutes обязательно',
      type: 'Поле durationMinutes должно быть целым числом от 30 до 240, кратным 30',
      minimum: 'Поле durationMinutes должно быть целым числом от 30 до 240, кратным 30',
      maximum: 'Поле durationMinutes должно быть целым числом от 30 до 240, кратным 30',
      multipleOf: 'Поле durationMinutes должно быть целым числом от 30 до 240, кратным 30',
    },
  },
]

/**
 * Проверяет форму и поля запроса на создание типа (спецификация §6.1)
 * и нормализует их: title и description обрезаются, пустое описание
 * превращается в null. Нарушение — 400 validation_error.
 */
export function validateCreateMeetingTypeRequest(request: unknown): CreateMeetingTypeInput {
  const body = requireJsonObject(request)

  // Нормализация до исполнения схемы: контрактные лимиты применяются к
  // тримированным значениям (спецификация §6). id — внешний идентификатор,
  // который задаёт владелец, и durationMinutes не тримятся.
  const title = typeof body.title === 'string' ? body.title.trim() : body.title
  const description =
    typeof body.description === 'string' ? body.description.trim() : body.description

  // Схема контракта исполняется первой: нарушение шаблона id, лимитов и границ
  // длительности отклоняется до бизнес-логики. Нормализация «пустое описание —
  // null» схемой не выражается и остаётся ручной.
  assertRequestBodyMatchesSchema(
    'post',
    '/api/meeting-types',
    { ...body, title, description },
    FIELD_MESSAGES,
  )

  const trimmedDescription = description as string | null | undefined
  const descriptionOrNull =
    trimmedDescription === undefined || trimmedDescription === null || trimmedDescription === ''
      ? null
      : trimmedDescription

  // Схема гарантирует строковость id и title и целочисленность durationMinutes;
  // приведения фиксируют эти инварианты.
  return {
    id: body.id as string,
    title: title as string,
    description: descriptionOrNull,
    durationMinutes: body.durationMinutes as number,
  }
}
