import type { DmmfField, DmmfModel } from './types'

const DEFAULT_EXCLUDED_TYPES = ['Bytes']

/** Convert PascalCase model name → camelCase property on PrismaClient. */
export function modelNameToClientKey(name: string): string {
  if (!name)
    return name
  return name.charAt(0).toLowerCase() + name.slice(1)
}

/** Filter out fields that should never be exposed to the LLM. */
export function exposedScalarFields(
  fields: DmmfField[],
  excludeTypes: string[] = DEFAULT_EXCLUDED_TYPES,
): DmmfField[] {
  const blocked = new Set(excludeTypes)
  return fields.filter(f => f.kind === 'scalar' && !blocked.has(f.type))
}

/** Filter out fields that should never appear as a `where` filter target. */
export function filterableScalarFields(
  fields: DmmfField[],
  excludeTypes: string[] = DEFAULT_EXCLUDED_TYPES,
): DmmfField[] {
  // Keep the same rule as exposedScalarFields; Json filtering is also
  // skipped (it never participates in `where`).
  return exposedScalarFields(fields, excludeTypes).filter(f => f.type !== 'Json')
}

/** Pick the unique-identifier fields used to build `findUnique` `where`. */
export function uniqueLookupFields(model: DmmfModel): DmmfField[] {
  return model.fields.filter(f => f.kind === 'scalar' && (f.isId || f.isUnique))
}

/**
 * Read DMMF from `@prisma/client`. Kept lazy + try/catch so the library
 * still loads in environments without `@prisma/client` (peer dep).
 */
export async function readDefaultDmmf(): Promise<{ models: DmmfModel[] }> {
  try {
    const mod = await import('@prisma/client') as unknown as {
      Prisma?: { dmmf?: { datamodel?: { models?: DmmfModel[] } } }
    }
    const models = mod.Prisma?.dmmf?.datamodel?.models ?? []
    return { models: [...models] }
  }
  catch (err) {
    throw new Error(
      `@bridgent/source-prisma: cannot import \`@prisma/client\`. Install it as a dependency. (${(err as Error).message})`,
    )
  }
}
