const TOOL_NAME_RE = /^[a-z_][\w-]{0,63}$/i

export function procedureToToolName(input: { path: string, toolPrefix?: string }): string {
  const prefix = slug(input.toolPrefix ?? 'trpc') || 'trpc'
  const path = slugPath(input.path) || 'procedure'
  return capName(`${prefix}_${path}`)
}

export function isValidToolName(name: string): boolean {
  return TOOL_NAME_RE.test(name)
}

function slugPath(path: string): string {
  return path
    .split('.')
    .map(part => slug(part))
    .filter(Boolean)
    .join('_')
}

function slug(input: string): string {
  return input
    .replace(/[^\w-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
}

function capName(name: string): string {
  let n = name.slice(0, 64)
  if (!/^[a-z_]/i.test(n))
    n = `_${n}`.slice(0, 64)
  if (!TOOL_NAME_RE.test(n))
    return slug(n).slice(0, 64) || '_tool'
  return n
}
