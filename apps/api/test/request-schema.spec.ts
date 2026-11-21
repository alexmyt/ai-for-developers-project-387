import { HttpException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import {
  assertRequestBodyMatchesSchema,
  type FieldMessages,
} from '../src/validation/request-schema'

// Маппинги нарушений схемы на русские тексты — такие же, как у request-
// валидаторов API; здесь они проверяют сам механизм исполнения схем.
const BOOKING_CHECKS: FieldMessages[] = [
  {
    field: 'meetingTypeId',
    messages: {
      required: 'Поле meetingTypeId обязательно',
      type: 'Поле meetingTypeId должно быть строкой',
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

const MEETING_TYPE_CHECKS: FieldMessages[] = [
  {
    field: 'description',
    messages: {
      type: 'Поле description должно быть строкой или null',
      maxLength: 'Поле description должно быть не длиннее 500 символов',
    },
  },
]

// Валидное тело брони: все ограничения схемы контракта соблюдены.
const VALID_BOOKING = {
  meetingTypeId: 'intro',
  start: '2026-11-12T07:00:00Z',
  name: 'Анна',
  email: 'anna@example.com',
}

/** Сообщение из конверта validation_error или маркер, что ошибки не было. */
function messageOf(method: 'post', path: string, body: unknown, checks: FieldMessages[]): string {
  try {
    assertRequestBodyMatchesSchema(method, path, body, checks)
  } catch (error) {
    const response = (error as HttpException).getResponse()
    return (response as { message: string }).message
  }
  return 'ошибки не было'
}

describe('assertRequestBodyMatchesSchema', () => {
  it('пропускает тело, соответствующее схеме контракта', () => {
    expect(() =>
      assertRequestBodyMatchesSchema('post', '/api/bookings', VALID_BOOKING, BOOKING_CHECKS),
    ).not.toThrow()
  })

  it('отклоняет отсутствие обязательного поля текстом первого нарушившего поля', () => {
    const rest: Record<string, unknown> = { ...VALID_BOOKING }
    delete rest.meetingTypeId
    expect(messageOf('post', '/api/bookings', rest, BOOKING_CHECKS)).toBe(
      'Поле meetingTypeId обязательно',
    )
  })

  it('отклоняет нестроковое поле текстом проверки типа', () => {
    expect(messageOf('post', '/api/bookings', { ...VALID_BOOKING, name: 42 }, BOOKING_CHECKS)).toBe(
      'Поле name должно быть строкой',
    )
  })

  it('выбирает текст по приоритету ключей, когда поле нарушает несколько ограничений', () => {
    // Длинный email без «@»: нарушены и maxLength, и pattern — прежний
    // порядок проверок сообщает сначала длину.
    expect(
      messageOf(
        'post',
        '/api/bookings',
        { ...VALID_BOOKING, email: 'a'.repeat(300) },
        BOOKING_CHECKS,
      ),
    ).toBe('Поле email должно быть не длиннее 254 символов')
  })

  it('транслирует OpenAPI nullable: null проходит, скаляр отклоняется', () => {
    const body = { id: 'review', title: 'Обзор проекта', durationMinutes: 30 }
    expect(() =>
      assertRequestBodyMatchesSchema(
        'post',
        '/api/meeting-types',
        { ...body, description: null },
        MEETING_TYPE_CHECKS,
      ),
    ).not.toThrow()
    expect(
      messageOf('post', '/api/meeting-types', { ...body, description: 42 }, MEETING_TYPE_CHECKS),
    ).toBe('Поле description должно быть строкой или null')
  })

  it('не отдаёт клиенту сырой вывод ajv для несмэппированного нарушения', () => {
    // Скаляр вместо объекта нарушает схему целиком: ни одно поле из маппинга
    // не матчится — срабатывает нейтральный запасной текст без instancePath.
    const message = messageOf('post', '/api/bookings', 42, BOOKING_CHECKS)
    expect(message).not.toContain('instancePath')
    expect(message).not.toContain('schemaPath')
  })

  it('падает с понятной ошибкой, когда в openapi.json нет схемы тела', () => {
    expect(() =>
      assertRequestBodyMatchesSchema('post', '/api/no-such-path', VALID_BOOKING, BOOKING_CHECKS),
    ).toThrow('В openapi.json нет схемы тела для POST /api/no-such-path')
  })
})
