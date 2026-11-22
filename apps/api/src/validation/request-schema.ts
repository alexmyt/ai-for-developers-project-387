// Исполнение JSON-схем request-телов из openapi.json в рантайме (ADR-0002):
// ограничения контракта — лимиты длины, шаблоны, границы и шаг длительности —
// проверяются схемой, а не ручными копиями правил. Клиенту отдаётся только
// детерминированный русский текст; сырой вывод ajv наружу не течёт.

import type { ErrorObject } from 'ajv'
import { compiledValidator, requestBodySchema } from './json-schema'
import { validationError } from './validation'

/**
 * Маппинг «поле → нарушение схемы → текст ошибки» для одного request-тела.
 * Порядок записей фиксирует порядок проверок спецификации; порядок ключей
 * messages задаёт приоритет, когда поле нарушает несколько ограничений сразу.
 * Ключи — ключевые слова JSON Schema (required, type, minLength, …), а также
 * зарезервированное слово MANUAL_KEYWORD для ручных проверок.
 */
export interface FieldMessages {
  field: string
  messages: Record<string, string>
  /**
   * Ручная проверка поля для ключа manual в messages: часть правил
   * (например, ISO-формат date-time) схемой сознательно не исполняется,
   * но в порядке проверок спецификации занимает своё место. Аргумент —
   * тело запроса, переданное на исполнение схемы.
   */
  manual?: (body: unknown) => boolean
}

/** Псевдо-ключевое слово для ручных проверок, не выражаемых JSON-схемой. */
const MANUAL_KEYWORD = 'manual'

/** Нейтральный текст для нарушений без маппинга: признак рассинхрона карт сообщений со схемой. */
const FALLBACK_MESSAGE = 'Тело запроса не соответствует контракту API'

/**
 * Нарушение относится к полю: required указывает его в params, остальное —
 * в instancePath. Селектор рассчитан на плоские тела текущего контракта
 * (путь нарушения — '/field'): вложенных объектов и массивов в схемах
 * request-телов нет — assert-тест в request-schema.spec.ts падает при их
 * появлении и напомнит расширить селектор.
 */
function matchesField(error: ErrorObject, field: string): boolean {
  return error.keyword === 'required'
    ? error.params.missingProperty === field
    : error.instancePath === `/${field}`
}

/**
 * Сообщение для выбранного детерминированно нарушения: первое по порядку
 * поле, у которого нарушен хоть один из его ключевых слов в порядке
 * приоритета. Ключ manual сверяется не со схемой, а с ручной проверкой
 * поля на теле запроса — так ручные правила встают в общий порядок.
 */
export function violationMessage(
  errors: ErrorObject[],
  checks: readonly FieldMessages[],
  body: unknown,
): string {
  for (const check of checks) {
    const fieldErrors = errors.filter((error) => matchesField(error, check.field))
    for (const [keyword, message] of Object.entries(check.messages)) {
      const violated =
        keyword === MANUAL_KEYWORD
          ? (check.manual?.(body) ?? false)
          : fieldErrors.some((error) => error.keyword === keyword)
      if (violated) {
        return message
      }
    }
  }
  return FALLBACK_MESSAGE
}

/**
 * Исполняет схему request-тела контракта для method + path. Тело, нарушившее
 * схему, отклоняется конвертом validation_error до бизнес-логики; текст —
 * из маппинга проверяющего.
 */
export function assertRequestBodyMatchesSchema(
  method: 'post',
  path: string,
  body: unknown,
  checks: readonly FieldMessages[],
): void {
  const validator = compiledValidator(
    `${method} ${path} request body`,
    requestBodySchema(method, path),
  )
  if (validator(body)) {
    return
  }
  throw validationError(violationMessage(validator.errors ?? [], checks, body))
}
