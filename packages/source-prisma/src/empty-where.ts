export function isEffectivelyEmptyWhere(where: unknown): boolean {
  return countScalarLeaves(where) === 0
}

function countScalarLeaves(value: unknown): number {
  if (!value || typeof value !== 'object')
    return 0
  if (Array.isArray(value))
    return value.reduce((sum, item) => sum + countScalarLeaves(item), 0)

  let count = 0
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'AND' || key === 'OR' || key === 'NOT') {
      count += countScalarLeaves(child)
      continue
    }
    if (child && typeof child === 'object' && !Array.isArray(child))
      count += Object.keys(child).length > 0 ? 1 : 0
    else if (child !== undefined)
      count += 1
  }
  return count
}
