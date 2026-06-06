/**
 * Generate an MCP-tool-name from an OpenAPI operation.
 *
 * Strategy:
 * 1. Prefer `operationId` (slugified, capped at 64 chars).
 * 2. Fallback: `${method}_${path-with-braces-stripped-and-slashes-as-underscores}`.
 *
 * The result must match `^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$` to play nicely with
 * Anthropic / Claude Code / Cursor / Gemini CLI tool registries.
 */

const TOOL_NAME_RE = /^[a-z_][\w-]{0,63}$/i

export function operationToToolName(opts: {
  operationId?: string
  method: string
  path: string
  namespace?: string
}): string {
  const namespace = opts.namespace ?? ''
  const base = opts.operationId
    ? slug(opts.operationId)
    : `${opts.method.toLowerCase()}_${slugPath(opts.path)}`

  return capName(`${namespace}${base}`)
}

function slug(input: string): string {
  // Replace any disallowed character with `_`, collapse repeats, trim.
  return input
    .replace(/[^\w-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
}

function slugPath(path: string): string {
  return slug(
    path
      .replace(/^\//, '')
      .replace(/\{([^}]+)\}/g, '$1') // {id} -> id
      .replace(/\//g, '_'),
  )
}

function capName(name: string): string {
  let n = name.slice(0, 64)
  // Ensure it starts with a letter or underscore.
  if (!/^[a-z_]/i.test(n))
    n = `_${n}`.slice(0, 64)
  if (!TOOL_NAME_RE.test(n))
    return slug(n).slice(0, 64) || '_tool'
  return n
}

export function isValidToolName(name: string): boolean {
  return TOOL_NAME_RE.test(name)
}
