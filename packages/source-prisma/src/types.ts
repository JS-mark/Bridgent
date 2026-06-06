export type PrismaReadMethod
  = | 'findUnique'
    | 'findFirst'
    | 'findMany'
    | 'count'
    | 'aggregate'

export type PrismaMutatingMethod
  = | 'create'
    | 'createMany'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'

export type PrismaMethod = PrismaReadMethod | PrismaMutatingMethod

export const READ_METHODS: PrismaReadMethod[] = [
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'aggregate',
]

export const MUTATING_METHODS: PrismaMutatingMethod[] = [
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
]

/** Subset of Prisma's DMMF we actually use (kept loose to avoid lib-version coupling). */
export interface DmmfModel {
  name: string
  dbName: string | null
  fields: DmmfField[]
}

export interface DmmfField {
  name: string
  type: string
  kind: 'scalar' | 'object' | 'enum'
  isId?: boolean
  isList?: boolean
  isRequired?: boolean
  isUnique?: boolean
  documentation?: string
}

export interface FromPrismaOptions {
  /** Already-instantiated PrismaClient. Bridgent doesn't connect/disconnect. */
  client: PrismaClientLike

  /** Tool name namespace prefix (e.g. `'db_'`). */
  namespace?: string

  /** Method allowlist. Default: read-only 5-piece. */
  allow?: {
    /** When true, also exposes create/update/delete/upsert variants. */
    mutating?: boolean
    /** Explicit method list. Overrides `mutating` when set. */
    methods?: PrismaMethod[]
  }

  /** Per-model filter (camelCase model name as on PrismaClient). */
  modelFilter?: RegExp | ((modelCamel: string) => boolean)

  /** Allowlist by final tool name (after namespace + slug). */
  allowTools?: string[]
  /** Denylist by final tool name. Applied after allowTools. */
  denyTools?: string[]

  /** Default `take` when not specified by the caller. Default 10000. */
  defaultTake?: number
  /** Hard cap clamped onto the caller's `take`. Default 10000. */
  maxTake?: number

  /** Per-query soft timeout in ms. Default 10000. */
  queryTimeoutMs?: number

  /** Field types to never expose. Default `['Bytes']`. */
  excludeFieldTypes?: string[]

  /**
   * Override how DMMF is read. Defaults to importing from `@prisma/client`
   * (`Prisma.dmmf.datamodel.models`). Useful for testing with mocks.
   */
  dmmf?: { models: DmmfModel[] }
}

/** Loose shape for any PrismaClient-like instance. */
export interface PrismaClientLike {
  [model: string]: unknown
}

/** Public tool result envelope (consistent with source-openapi). */
export interface PrismaToolResult<T = unknown> {
  ok: boolean
  result?: T
  meta?: {
    count?: number
    takeApplied?: number
    warning?: string
  }
  error?: {
    kind: 'timeout' | 'invalid_input' | 'prisma' | 'unknown'
    message: string
  }
}
