import type { FromPrismaOptions, PrismaMethod } from './types'
import { MUTATING_METHODS, READ_METHODS } from './types'

export function resolveAllowedMethods(opts: FromPrismaOptions): PrismaMethod[] {
  if (opts.allow?.methods)
    return opts.allow.methods

  if (opts.allow?.mutating)
    return [...READ_METHODS, ...MUTATING_METHODS]

  return [...READ_METHODS]
}

export function modelPasses(modelCamel: string, opts: FromPrismaOptions): boolean {
  if (!opts.modelFilter)
    return true
  return typeof opts.modelFilter === 'function'
    ? opts.modelFilter(modelCamel)
    : opts.modelFilter.test(modelCamel)
}

export function toolNamePasses(name: string, opts: FromPrismaOptions): boolean {
  if (opts.allowTools && opts.allowTools.length > 0 && !opts.allowTools.includes(name))
    return false
  if (opts.denyTools?.includes(name))
    return false
  return true
}
