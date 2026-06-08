import type { DmmfModel } from './types'
import { uniqueLookupFields } from './dmmf'

export function assertWhereOnlyUniqueFields(where: unknown, model: DmmfModel): string | undefined {
  if (!where || typeof where !== 'object' || Array.isArray(where))
    return '`where` with an id or unique field is required'

  const keys = Object.keys(where)
  if (keys.length === 0)
    return '`where` with an id or unique field is required'

  const unique = new Set(uniqueLookupFields(model).map(field => field.name))
  const invalid = keys.filter(key => !unique.has(key))
  return invalid.length > 0
    ? `where must use only id/unique fields; invalid keys: ${invalid.join(', ')}`
    : undefined
}
