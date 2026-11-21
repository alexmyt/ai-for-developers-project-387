import type { ValidateFunction } from 'ajv'
import Ajv from 'ajv'
import openapiJson from '@repo/contract/openapi.json'

// Схемы запросов и ответов берём из openapi.json — источника истины
// контракта (ADR-0002). openapi.json приходит prod-зависимостью
// @repo/contract, поэтому импорт резолвится и из собранного dist.
const openapi = openapiJson as unknown as OpenapiDocument

export type Schema = Record<string, unknown>

interface Operation {
  requestBody?: { content: Record<string, { schema: Schema }> }
  responses: Record<string, { content: Record<string, { schema: Schema }> }>
}

interface OpenapiDocument {
  paths: Record<string, Record<string, Operation>>
  components: { schemas?: Record<string, Schema> }
}

// OpenAPI расширяет JSON Schema словом nullable, ajv его не понимает:
// переводим «type + nullable» в массив типов перед компиляцией.
export function toJsonSchema(schema: Schema): Schema {
  const { nullable, ...rest } = schema
  if (nullable === true && typeof rest.type === 'string') {
    rest.type = [rest.type, 'null']
  }
  if (rest.items !== undefined) {
    rest.items = toJsonSchema(rest.items as Schema)
  }
  if (rest.properties !== undefined) {
    rest.properties = Object.fromEntries(
      Object.entries(rest.properties as Record<string, Schema>).map(([name, child]) => [
        name,
        toJsonSchema(child),
      ]),
    )
  }
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    if (Array.isArray(rest[key])) {
      rest[key] = (rest[key] as Schema[]).map(toJsonSchema)
    }
  }
  return rest
}

const validators = new Map<string, ValidateFunction>()

/**
 * Компилирует валидатор один раз и кеширует по ключу: компиляция схемы
 * на каждый запрос недопустима. $ref'ы указывают на #/components/schemas,
 * поэтому компоненты кладём в корень документа.
 */
export function compiledValidator(key: string, schema: Schema): ValidateFunction {
  const cached = validators.get(key)
  if (cached) {
    return cached
  }
  const componentSchemas = openapi.components.schemas ?? {}
  const ajv = new Ajv({ strict: false, validateFormats: false, allErrors: true })
  const validator = ajv.compile({
    ...toJsonSchema(schema),
    components: {
      schemas: Object.fromEntries(
        Object.entries(componentSchemas).map(([name, component]) => [
          name,
          toJsonSchema(component),
        ]),
      ),
    },
  })
  validators.set(key, validator)
  return validator
}

/** Схема request-тела для method + path; отсутствие — рассинхрон контракта. */
export function requestBodySchema(method: 'post', path: string): Schema {
  const schema = openapi.paths[path]?.[method]?.requestBody?.content['application/json']?.schema
  if (!schema) {
    throw new Error(`В openapi.json нет схемы тела для ${method.toUpperCase()} ${path}`)
  }
  return schema
}

/** Схема ответа для method + path + status; отсутствие — рассинхрон контракта. */
export function responseSchema(method: 'get' | 'post', path: string, status: number): Schema {
  const schema =
    openapi.paths[path]?.[method]?.responses[String(status)]?.content['application/json']?.schema
  if (!schema) {
    throw new Error(`В openapi.json нет схемы для ${method.toUpperCase()} ${path} → ${status}`)
  }
  return schema
}
