import { HttpException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import openapiJson from '@repo/contract/openapi.json'
import { FIELD_MESSAGES as BOOKING_CHECKS } from '../src/occupancy/booking-validation'
import { FIELD_MESSAGES as MEETING_TYPE_CHECKS } from '../src/meeting-types/meeting-type-validation'
import {
  assertRequestBodyMatchesSchema,
  type FieldMessages,
} from '../src/validation/request-schema'

// Маппинги нарушений схемы на русские тексты — продовые, из request-
// валидаторов API: тест механизма видит настоящие тексты и ловит их дрейф.

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

  it('ручная проверка поля встаёт в порядок проверок между schema-нарушениями', () => {
    // Не-ISO start — ручная проверка (format схемой не исполняется),
    // нарушение длины name — из схемы: в порядке §8 ISO-формат start
    // проверялся раньше длины name, побеждает текст про start.
    expect(
      messageOf(
        'post',
        '/api/bookings',
        { ...VALID_BOOKING, start: '2026-11-12 07:00:00', name: 'А'.repeat(101) },
        BOOKING_CHECKS,
      ),
    ).toBe('Поле start должно быть UTC-инстантом в формате ISO 8601 с Z')
  })

  it('ручная проверка не срабатывает, когда поле violates схему раньше неё', () => {
    // Нестроковый start не доходит до ручной ISO-проверки: тип — из схемы.
    expect(
      messageOf('post', '/api/bookings', { ...VALID_BOOKING, start: 42 }, BOOKING_CHECKS),
    ).toBe('Поле start должно быть строкой')
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

// Селектор нарушений в request-schema.ts рассчитан на плоские тела:
// путь нарушения — '/field'. Появление вложенных объектов или массивов
// в схемах request-телов ломает сопоставление полей — тест ниже падает
// и напомнит расширить селектор.
const openapi = openapiJson as {
  paths: Record<
    string,
    Record<string, { requestBody?: { content: Record<string, { schema: unknown }> } } | undefined>
  >
  components: { schemas: Record<string, unknown> }
}

interface SchemaNode {
  type?: unknown
  $ref?: string
  properties?: Record<string, unknown>
  items?: unknown
}

/** Разыменовывает $ref в компонентах контракта; без $ref возвращает узел как есть. */
function resolve(node: unknown): SchemaNode {
  const ref = (node as SchemaNode).$ref
  if (ref === undefined) {
    return node as SchemaNode
  }
  return openapi.components.schemas[ref.replace('#/components/schemas/', '')] as SchemaNode
}

describe('плоские тела запроса', () => {
  it('поля схем request-телов — скаляры, без вложенных объектов и массивов', () => {
    for (const [path, operations] of Object.entries(openapi.paths)) {
      const schema = operations.post?.requestBody?.content['application/json']?.schema
      if (schema === undefined) {
        continue
      }
      const body = resolve(schema)
      expect(body.type, `POST ${path}: тело — объект`).toBe('object')
      for (const [name, field] of Object.entries(body.properties ?? {})) {
        const resolved = resolve(field)
        expect(
          ['string', 'number', 'integer', 'boolean'],
          `POST ${path}: поле ${name} — скаляр`,
        ).toContain(resolved.type)
        expect(
          resolved.properties,
          `POST ${path}: поле ${name} без вложенных объектов`,
        ).toBeUndefined()
        expect(resolved.items, `POST ${path}: поле ${name} без массивов`).toBeUndefined()
      }
    }
  })
})
