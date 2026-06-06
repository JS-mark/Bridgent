import { dereference, load } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import { readFiles } from '@scalar/openapi-parser/plugins/read-files'

export interface DereferencedSpec {
  /** Top-level OpenAPI document with all `$ref`s resolved. */
  document: Record<string, any>
  /** Detected version, e.g. '3.0' / '3.1'. */
  version?: string
}

/**
 * Load + dereference any OpenAPI 3.x source.
 *
 * Accepts:
 * - URL string (https://…)
 * - File path (./openapi.yaml, /abs/path.json)
 * - Inline JSON object
 * - YAML / JSON string
 *
 * Errors during load/dereference are collected; the function throws if the
 * spec cannot be turned into a usable document.
 */
export async function parseOpenApi(
  source: string | Record<string, unknown>,
): Promise<DereferencedSpec> {
  // For object input, dereference accepts it directly.
  if (typeof source !== 'string') {
    const result = dereference(source as Record<string, unknown>)
    if (!result.schema)
      throw new OpenApiParseError('dereference returned no schema', result.errors ?? [])
    return { document: result.schema as Record<string, any>, version: result.version }
  }

  // For string input (URL / file path / raw text), let `load` figure it out.
  const loaded = await load(source, {
    plugins: [readFiles(), fetchUrls()],
  })

  if (!loaded.specification)
    throw new OpenApiParseError(`Failed to load spec from ${source}`, loaded.errors ?? [])

  const result = dereference(loaded.filesystem)
  if (!result.schema)
    throw new OpenApiParseError('dereference returned no schema', result.errors ?? [])

  return { document: result.schema as Record<string, any>, version: result.version }
}

export class OpenApiParseError extends Error {
  override name = 'OpenApiParseError'
  constructor(
    message: string,
    public readonly errors: ReadonlyArray<{ message: string, path?: string[] }>,
  ) {
    super(`${message}${errors.length ? `: ${errors.map(e => e.message).join('; ')}` : ''}`)
  }
}
