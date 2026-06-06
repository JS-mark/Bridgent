import { z } from 'zod'

type JsonSchema = Record<string, unknown> & {
  type?: string | string[]
  enum?: unknown[]
  const?: unknown
  oneOf?: JsonSchema[]
  anyOf?: JsonSchema[]
  allOf?: JsonSchema[]
  nullable?: boolean
  description?: string
  default?: unknown
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number | boolean
  exclusiveMaximum?: number | boolean
  items?: JsonSchema
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean | JsonSchema
}

/**
 * Convert a JSON Schema (OpenAPI 3.0/3.1 subset) into a Zod schema.
 *
 * Coverage: object/array/string/number/integer/boolean/enum/const/oneOf/anyOf/
 * allOf-merge/nullable/format(email|uuid|date-time|url)/min-max/required/
 * additionalProperties.
 *
 * Out of scope (v0.1): discriminator (falls back to z.union).
 */
export function jsonSchemaToZod(input: JsonSchema | undefined | null): z.ZodTypeAny {
  if (!input || typeof input !== 'object')
    return z.any()

  // 3.1: type can be array including 'null'
  if (Array.isArray(input.type) && input.type.includes('null')) {
    const rest = input.type.filter(t => t !== 'null')
    const next: JsonSchema = {
      ...input,
      type: rest.length === 1 ? rest[0] : rest,
    }
    return describe(jsonSchemaToZod(next).nullable(), input.description)
  }

  // 3.0: nullable: true
  if (input.nullable === true) {
    const { nullable, ...rest } = input
    return describe(jsonSchemaToZod(rest).nullable(), input.description)
  }

  // const literal (3.1)
  if ('const' in input && input.const !== undefined)
    return describe(z.literal(input.const as never), input.description)

  // enum
  if (Array.isArray(input.enum) && input.enum.length > 0) {
    const allStrings = input.enum.every(v => typeof v === 'string')
    if (allStrings) {
      const values = input.enum as [string, ...string[]]
      return describe(z.enum(values), input.description)
    }
    // mixed-type enum → union of literals
    const variants = input.enum.map(v => z.literal(v as never)) as unknown as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
    return describe(z.union(variants), input.description)
  }

  // oneOf / anyOf
  if (Array.isArray(input.oneOf) || Array.isArray(input.anyOf)) {
    const variants = (input.oneOf ?? input.anyOf!).map(jsonSchemaToZod)
    if (variants.length === 1)
      return describe(variants[0]!, input.description)
    return describe(
      z.union(variants as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]),
      input.description,
    )
  }

  // allOf — shallow object merge (sufficient for v0.1 OpenAPI usage)
  if (Array.isArray(input.allOf) && input.allOf.length > 0) {
    const merged: JsonSchema = { type: 'object', properties: {}, required: [] }
    for (const part of input.allOf) {
      if (part.properties)
        merged.properties = { ...merged.properties, ...part.properties }
      if (Array.isArray(part.required))
        merged.required = [...(merged.required ?? []), ...part.required]
    }
    if (input.description)
      merged.description = input.description
    return jsonSchemaToZod(merged)
  }

  const type = Array.isArray(input.type) ? input.type[0] : input.type

  switch (type) {
    case 'string':
      return describe(buildString(input), input.description)
    case 'integer':
    case 'number':
      return describe(buildNumber(input, type === 'integer'), input.description)
    case 'boolean':
      return describe(z.boolean(), input.description)
    case 'array':
      return describe(z.array(jsonSchemaToZod(input.items)), input.description)
    case 'object':
    default:
      return describe(buildObject(input), input.description)
  }
}

function buildString(s: JsonSchema): z.ZodTypeAny {
  let zs: z.ZodString = z.string()
  switch (s.format) {
    case 'email':
      zs = zs.email()
      break
    case 'uuid':
      zs = zs.uuid()
      break
    case 'date-time':
      zs = zs.datetime({ offset: true })
      break
    case 'uri':
    case 'url':
      zs = zs.url()
      break
  }
  if (typeof s.minLength === 'number')
    zs = zs.min(s.minLength)
  if (typeof s.maxLength === 'number')
    zs = zs.max(s.maxLength)
  if (typeof s.pattern === 'string') {
    try {
      zs = zs.regex(new RegExp(s.pattern))
    }
    catch {
      // ignore invalid regex; tolerate malformed specs
    }
  }
  return zs
}

function buildNumber(s: JsonSchema, integer: boolean): z.ZodTypeAny {
  let zn: z.ZodNumber = z.number()
  if (integer)
    zn = zn.int()
  if (typeof s.minimum === 'number')
    zn = zn.min(s.minimum)
  if (typeof s.maximum === 'number')
    zn = zn.max(s.maximum)
  if (typeof s.exclusiveMinimum === 'number')
    zn = zn.gt(s.exclusiveMinimum)
  if (typeof s.exclusiveMaximum === 'number')
    zn = zn.lt(s.exclusiveMaximum)
  return zn
}

function buildObject(s: JsonSchema): z.ZodTypeAny {
  const props = s.properties ?? {}
  const required = new Set<string>(s.required ?? [])
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [key, value] of Object.entries(props)) {
    const inner = jsonSchemaToZod(value)
    shape[key] = required.has(key) ? inner : inner.optional()
  }

  let obj: z.ZodTypeAny = z.object(shape)

  // additionalProperties
  if (s.additionalProperties === true) {
    // passthrough lets unknown keys through verbatim
    obj = (obj as z.ZodObject<z.ZodRawShape>).passthrough()
  }
  else if (typeof s.additionalProperties === 'object' && s.additionalProperties !== null) {
    // allow specific shape for unknown keys; still keep declared props strict
    obj = (obj as z.ZodObject<z.ZodRawShape>).catchall(jsonSchemaToZod(s.additionalProperties))
  }

  return obj
}

function describe(schema: z.ZodTypeAny, description: string | undefined): z.ZodTypeAny {
  return description ? schema.describe(description) : schema
}
