export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'

export const SAFE_METHODS: HttpMethod[] = ['GET', 'HEAD']
export const MUTATING_METHODS: HttpMethod[] = ['POST', 'PUT', 'PATCH', 'DELETE']

export interface BearerAuth {
  type: 'bearer'
  token: string | (() => string | Promise<string>)
}

export interface FromOpenApiOptions {
  /** Spec source: file path, URL, JSON object, or YAML/JSON string. */
  spec: string | Record<string, unknown>

  /** Override `spec.servers[0].url` (e.g. sandbox vs prod). */
  baseUrl?: string

  /** Authentication. v0.1 supports Bearer only. */
  auth?: BearerAuth

  /** Tool name namespace prefix. e.g. `gh_` to avoid collisions across sources. */
  namespace?: string

  /** Method allowlist. Default: GET/HEAD only (read-only). */
  allow?: {
    /** When `true`, also exposes POST/PUT/PATCH/DELETE. */
    mutating?: boolean
    /** Explicit method list. Overrides `mutating` when set. */
    methods?: HttpMethod[]
  }

  /** Operation allowlist by `operationId`. When non-empty, ONLY these are exposed. */
  allowOperations?: string[]

  /** Operation denylist by `operationId`. Applied after `allowOperations`. */
  denyOperations?: string[]

  /** Path filter. Cuts down enormous specs (e.g. GitHub). */
  pathFilter?: RegExp | ((path: string) => boolean)

  /** Whether to honor `x-bridgent-allow: false` on operations. Default: true. */
  respectExtensions?: boolean

  /** Custom fetch (for testing or proxying). Default: `globalThis.fetch`. */
  fetch?: typeof globalThis.fetch
}

/** Internal: a normalized operation ready to be transformed into a BridgentTool. */
export interface NormalizedOperation {
  operationId: string
  method: HttpMethod
  path: string
  summary?: string
  description?: string
  parameters: ParameterObject[]
  requestBody?: RequestBodyObject
  raw: OperationObject
}

export interface ParameterObject {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean
  description?: string
  schema?: Record<string, unknown>
}

export interface RequestBodyObject {
  description?: string
  required?: boolean
  content?: Record<string, { schema?: Record<string, unknown> }>
}

export interface OperationObject {
  operationId?: string
  summary?: string
  description?: string
  parameters?: ParameterObject[]
  requestBody?: RequestBodyObject
  responses?: Record<string, unknown>
  [extension: `x-${string}`]: unknown
}
