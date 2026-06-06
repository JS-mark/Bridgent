import type { FromOpenApiOptions, HttpMethod, OperationObject } from './types'
import { MUTATING_METHODS, SAFE_METHODS } from './types'

export interface FilterContext {
  path: string
  method: HttpMethod
  operation: OperationObject
}

/**
 * Apply the filtering pipeline:
 *   1. method ∈ allow.methods (default GET/HEAD)
 *   2. pathFilter
 *   3. respectExtensions && op['x-bridgent-allow'] === false → drop
 *   4. denyOperations
 *   5. allowOperations (if non-empty, gate)
 */
export function shouldExposeOperation(
  ctx: FilterContext,
  opts: FromOpenApiOptions,
): boolean {
  const allowedMethods = resolveAllowedMethods(opts)
  if (!allowedMethods.includes(ctx.method))
    return false

  if (opts.pathFilter) {
    const passes = typeof opts.pathFilter === 'function'
      ? opts.pathFilter(ctx.path)
      : opts.pathFilter.test(ctx.path)
    if (!passes)
      return false
  }

  const respectExt = opts.respectExtensions ?? true
  if (respectExt && ctx.operation['x-bridgent-allow'] === false)
    return false

  const opId = ctx.operation.operationId
  if (opId && opts.denyOperations?.includes(opId))
    return false

  if (opts.allowOperations && opts.allowOperations.length > 0) {
    if (!opId || !opts.allowOperations.includes(opId))
      return false
  }

  return true
}

export function resolveAllowedMethods(opts: FromOpenApiOptions): HttpMethod[] {
  if (opts.allow?.methods)
    return opts.allow.methods

  if (opts.allow?.mutating)
    return [...SAFE_METHODS, ...MUTATING_METHODS]

  return [...SAFE_METHODS]
}
