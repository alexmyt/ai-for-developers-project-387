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
 * Ключи — ключевые слова JSON Schema (required, type, minLength, …).
 */
export interface FieldMessages {
  field: string
  messages: Partial<Record<string, string>>
}

/** Нейтральный текст для нарушений без маппинга: признак рассинхрона карт сообщений со схемой. */
const FALLBACK_MESSAGE = 'Тело запроса не соответствует контракту API'

/** Нарушение относится к полю: required указывает его в params, остальное — в instancePath. */
function matchesField(error: ErrorObject, field: string): boolean {
  return error.keyword === 'required'
    ? error.params.missingProperty === field
    : error.instancePath === `/${field}`
}

/**
 * Сообщение для выбранного детерминированно нарушения: первое по порядку
 * поле, у которого нарушен хоть один из его ключевых слов в порядке приоритета.
 */
export function violationMessage(errors: ErrorObject[], checks: readonly FieldMessages[]): string {
  for (const check of checks) {
    const fieldErrors = errors.filter((error) => matchesField(error, check.field))
    for (const [keyword, message] of Object.entries(check.messages)) {
      if (message !== undefined && fieldErrors.some((error) => error.keyword === keyword)) {
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
  throw validationError(violationMessage(validator.errors ?? [], checks))
}
