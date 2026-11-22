import type { ValidateFunction } from 'ajv'
import { compiledValidator, responseSchema } from '../src/validation/json-schema'

// Компиляция и кеш схем — общий механизм с рантаймом request-валидаторов
// (apps/api/src/validation/json-schema.ts); здесь только ассерты ответов.

function responseValidator(method: 'get' | 'post', path: string, status: number): ValidateFunction {
  return compiledValidator(`${method} ${path} ${status}`, responseSchema(method, path, status))
}

/** Валидирует тело ответа по схеме openapi.json; кидает ошибку со списком нарушений. */
export function expectValidResponse(
  method: 'get' | 'post',
  path: string,
  status: number,
  body: unknown,
): void {
  const validator = responseValidator(method, path, status)
  if (!validator(body)) {
    throw new Error(`Ответ не соответствует openapi.json: ${JSON.stringify(validator.errors)}`)
  }
}
