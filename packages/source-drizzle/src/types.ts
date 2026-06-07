export interface FromDrizzleOptions {
  db: DrizzleDbLike
  tables: Record<string, DrizzleTableLike>
  namespace?: string
  tableFilter?: RegExp | ((tableName: string) => boolean)
  defaultLimit?: number
  maxLimit?: number
}

export interface DrizzleDbLike {
  select: () => DrizzleSelectLike
}

export interface DrizzleSelectLike {
  from: (table: DrizzleTableLike) => DrizzleQueryLike
}

export interface DrizzleQueryLike extends PromiseLike<unknown[]> {
  limit?: (limit: number) => DrizzleQueryLike
  offset?: (offset: number) => DrizzleQueryLike
}

export type DrizzleTableLike = object

export interface DrizzleToolResult<T = unknown> {
  ok: boolean
  result?: T
  meta?: {
    count?: number
    limitApplied?: number
    warning?: string
  }
  error?: {
    kind: 'drizzle' | 'unknown'
    message: string
  }
}
