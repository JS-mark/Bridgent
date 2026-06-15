import type { TrpcProcedureKind, TrpcRouterLike } from './types'

export interface TrpcProcedureInfo {
  path: string
  kind: TrpcProcedureKind
  procedure: TrpcProcedureLike
}

export interface TrpcProcedureLike {
  _def?: {
    type?: unknown
    inputs?: unknown[]
    query?: unknown
    mutation?: unknown
    subscription?: unknown
  }
}

export function listProcedures(router: TrpcRouterLike): TrpcProcedureInfo[] {
  if (!router || typeof router.createCaller !== 'function')
    throw new Error('@bridgent/source-trpc: `router` with createCaller() is required.')

  const procedures = router._def?.procedures
  if (!procedures || typeof procedures !== 'object')
    throw new Error('@bridgent/source-trpc: unsupported router shape; expected router._def.procedures.')

  return Object.entries(procedures).map(([path, procedure]) => ({
    path,
    procedure: asProcedure(path, procedure),
    kind: getProcedureKind(path, procedure),
  }))
}

function asProcedure(path: string, value: unknown): TrpcProcedureLike {
  if (!value || !hasProcedureDef(value))
    throw new Error(`@bridgent/source-trpc: unsupported procedure shape at "${path}".`)
  return value as TrpcProcedureLike
}

function hasProcedureDef(value: unknown): value is { _def: unknown } {
  if (value === null)
    return false
  return (typeof value === 'object' || typeof value === 'function') && '_def' in value
}

function getProcedureKind(path: string, value: unknown): TrpcProcedureKind {
  const procedure = asProcedure(path, value)
  const def = procedure._def
  if (!def)
    throw new Error(`@bridgent/source-trpc: unsupported procedure shape at "${path}".`)

  if (def.type === 'query' || def.type === 'mutation' || def.type === 'subscription')
    return def.type

  if ('query' in def)
    return 'query'
  if ('mutation' in def)
    return 'mutation'
  if ('subscription' in def)
    return 'subscription'

  throw new Error(`@bridgent/source-trpc: cannot determine procedure kind for "${path}".`)
}
