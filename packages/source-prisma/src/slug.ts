import type { PrismaMethod } from './types'

const TOOL_NAME_RE = /^[a-z_][\w-]{0,63}$/i

export function buildToolName(opts: {
  modelCamel: string
  method: PrismaMethod
  namespace?: string
}): string {
  const { modelCamel, method, namespace = '' } = opts
  const base = `${modelCamel}_${method}`
  return capName(`${namespace}${base}`)
}

function capName(name: string): string {
  let n = name.slice(0, 64)
  if (!/^[a-z_]/i.test(n))
    n = `_${n}`.slice(0, 64)
  if (!TOOL_NAME_RE.test(n)) {
    return n
      .replace(/[^\w-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_{2,}/g, '_')
      .slice(0, 64) || '_tool'
  }
  return n
}

export function isValidToolName(name: string): boolean {
  return TOOL_NAME_RE.test(name)
}
