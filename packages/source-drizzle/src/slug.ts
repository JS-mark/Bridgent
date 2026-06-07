export function buildToolName(input: { tableName: string, namespace?: string }): string {
  return `${input.namespace ?? ''}${slug(input.tableName)}_find_many`
}

function slug(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}
