import type { DmmfField, DmmfModel } from './types'
import { z } from 'zod'
import { exposedScalarFields, filterableScalarFields, uniqueLookupFields } from './dmmf'

/**
 * Map a Prisma scalar type to a Zod schema for filter VALUES (where input),
 * not for full-row output. Keeps the LLM-facing surface narrow.
 */
function valueSchemaFor(type: string): z.ZodTypeAny {
  switch (type) {
    case 'String':
      return z.string()
    case 'Boolean':
      return z.boolean()
    case 'Int':
      return z.number().int()
    case 'Float':
      return z.number()
    case 'BigInt':
    case 'Decimal':
      // Pass numeric strings to avoid JSON serialization pitfalls.
      return z.string()
    case 'DateTime':
      return z.string().datetime({ offset: true })
    case 'Json':
      return z.unknown()
    default:
      // Enums or unknown scalars → fall back to string identity
      return z.string()
  }
}

function fieldFilterSchema(field: DmmfField): z.ZodTypeAny {
  const v = valueSchemaFor(field.type)
  switch (field.type) {
    case 'String':
      return z.object({
        equals: v.optional(),
        contains: v.optional(),
        startsWith: v.optional(),
        endsWith: v.optional(),
        in: z.array(v).optional(),
        notIn: z.array(v).optional(),
      }).partial().describe(field.documentation ?? `Filter on \`${field.name}\``)
    case 'Boolean':
      return z.object({
        equals: v.optional(),
      }).partial().describe(field.documentation ?? `Filter on \`${field.name}\``)
    case 'Int':
    case 'Float':
    case 'BigInt':
    case 'Decimal':
    case 'DateTime':
      return z.object({
        equals: v.optional(),
        gt: v.optional(),
        gte: v.optional(),
        lt: v.optional(),
        lte: v.optional(),
        in: z.array(v).optional(),
      }).partial().describe(field.documentation ?? `Filter on \`${field.name}\``)
    default:
      return z.object({
        equals: v.optional(),
      }).partial()
  }
}

/** Build a `where` zod schema for a model. */
export function buildWhereSchema(model: DmmfModel, excludeTypes?: string[]): z.ZodObject<z.ZodRawShape> {
  const fields = filterableScalarFields(model.fields, excludeTypes)
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields)
    shape[f.name] = fieldFilterSchema(f).optional()

  // Recursive AND/OR/NOT — typed loosely to avoid z.lazy gymnastics.
  shape.AND = z.array(z.record(z.string(), z.unknown())).optional()
  shape.OR = z.array(z.record(z.string(), z.unknown())).optional()
  shape.NOT = z.record(z.string(), z.unknown()).optional()

  return z.object(shape).strict()
}

/** Build a `select` zod schema (only scalar, non-Bytes fields). */
export function buildSelectSchema(model: DmmfModel, excludeTypes?: string[]): z.ZodObject<z.ZodRawShape> {
  const fields = exposedScalarFields(model.fields, excludeTypes)
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields)
    shape[f.name] = z.boolean().optional().describe(f.documentation ?? `Include the \`${f.name}\` column`)
  return z.object(shape).strict()
}

/** Build an `orderBy` zod schema. */
export function buildOrderBySchema(model: DmmfModel, excludeTypes?: string[]): z.ZodObject<z.ZodRawShape> {
  const fields = exposedScalarFields(model.fields, excludeTypes)
  const direction = z.enum(['asc', 'desc']).optional()
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields)
    shape[f.name] = direction.describe(`Sort by \`${f.name}\``)
  return z.object(shape).strict()
}

/** Build a `where` schema usable for `findUnique` (only id/unique fields). */
export function buildUniqueWhereSchema(model: DmmfModel): z.ZodObject<z.ZodRawShape> {
  const fields = uniqueLookupFields(model)
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields)
    shape[f.name] = valueSchemaFor(f.type).optional().describe(f.documentation ?? `Look up by \`${f.name}\``)
  return z.object(shape).strict()
}

/** Build a `data` zod schema for create/upsert.create style writes. */
export function buildCreateDataSchema(model: DmmfModel, excludeTypes?: string[]): z.ZodObject<z.ZodRawShape> {
  const fields = exposedScalarFields(model.fields, excludeTypes)
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields) {
    const fieldSchema = valueSchemaFor(f.type).describe(f.documentation ?? `Set \`${f.name}\``)
    shape[f.name] = isRequiredCreateField(f) ? fieldSchema : fieldSchema.optional()
  }
  return z.object(shape).strict()
}

/** Build a `data` zod schema for update/updateMany/upsert.update writes. */
export function buildUpdateDataSchema(model: DmmfModel, excludeTypes?: string[]): z.ZodObject<z.ZodRawShape> {
  const fields = exposedScalarFields(model.fields, excludeTypes)
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields.filter(isWritableUpdateField))
    shape[f.name] = valueSchemaFor(f.type).optional().describe(f.documentation ?? `Set \`${f.name}\``)
  return z.object(shape).strict()
}

function isRequiredCreateField(field: DmmfField): boolean {
  return field.isRequired === true
    && field.isId !== true
    && field.hasDefaultValue !== true
    && field.isGenerated !== true
    && field.isUpdatedAt !== true
}

function isWritableUpdateField(field: DmmfField): boolean {
  return field.isId !== true
    && field.isUnique !== true
    && field.isGenerated !== true
    && field.isUpdatedAt !== true
}

export function buildCreateManyDataSchema(model: DmmfModel, excludeTypes?: string[]): z.ZodArray<z.ZodObject<z.ZodRawShape>> {
  return z.array(buildCreateDataSchema(model, excludeTypes)).min(1)
}

/** Numeric-aggregable fields, used to build aggregate {_sum,_avg,_min,_max}. */
export function aggregatableNumericFields(model: DmmfModel, excludeTypes?: string[]): DmmfField[] {
  const fields = exposedScalarFields(model.fields, excludeTypes)
  return fields.filter(f => f.type === 'Int' || f.type === 'Float' || f.type === 'BigInt' || f.type === 'Decimal')
}
