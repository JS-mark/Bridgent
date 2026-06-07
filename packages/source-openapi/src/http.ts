import type { BearerAuth, NormalizedOperation } from './types'

export interface BuiltRequest {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
}

export interface InvokeOptions {
  baseUrl: string
  auth?: BearerAuth
  fetch: typeof globalThis.fetch
}

/** Build a fetch-ready request from flattened tool args + an OpenAPI operation. */
export function buildRequest(
  op: NormalizedOperation,
  args: Record<string, unknown>,
  baseUrl: string,
): BuiltRequest {
  const pathParams: Record<string, string> = {}
  const queryParams = new URLSearchParams()
  const headers: Record<string, string> = { Accept: 'application/json' }

  for (const param of op.parameters) {
    const raw = args[param.inputKey ?? param.name]
    if (raw === undefined || raw === null) {
      if (param.required && param.in === 'path')
        throw new Error(`Missing required path param "${param.name}" for ${op.operationId}`)
      continue
    }
    const value = String(raw)
    switch (param.in) {
      case 'path':
        pathParams[param.name] = value
        break
      case 'query':
        if (Array.isArray(raw)) {
          for (const v of raw) queryParams.append(param.name, String(v))
        }
        else {
          queryParams.set(param.name, value)
        }
        break
      case 'header':
        headers[param.name] = value
        break
      case 'cookie':
        // Cookies aren't first-class for v0.1; skip silently.
        break
    }
  }

  // Path interpolation
  let path = op.path
  for (const [key, value] of Object.entries(pathParams)) {
    path = path.replace(`{${key}}`, encodeURIComponent(value))
  }

  // Body (only when requestBody declared and `body` arg present)
  let body: string | undefined
  if (op.requestBody && args.body !== undefined) {
    body = JSON.stringify(args.body)
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
  }

  const qs = queryParams.toString()
  const url = `${trimTrailingSlash(baseUrl)}${path}${qs ? `?${qs}` : ''}`

  return { url, method: op.method, headers, body }
}

/** Send a built request and package the response as a structured result. */
export async function invokeRequest(
  built: BuiltRequest,
  opts: InvokeOptions,
): Promise<{
  ok: boolean
  status: number
  statusText: string
  body: unknown
  headers: Record<string, string>
}> {
  const headers = { ...built.headers }
  if (opts.auth?.type === 'bearer') {
    const token = typeof opts.auth.token === 'function'
      ? await opts.auth.token()
      : opts.auth.token
    if (token)
      headers.Authorization = `Bearer ${token}`
  }

  const response = await opts.fetch(built.url, {
    method: built.method,
    headers,
    body: built.body,
  })

  const responseHeaders: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value
  })

  const text = await response.text()
  let parsedBody: unknown
  const contentType = responseHeaders['content-type'] ?? ''
  if (contentType.includes('application/json')) {
    try {
      parsedBody = text.length > 0 ? JSON.parse(text) : null
    }
    catch {
      parsedBody = text
    }
  }
  else {
    // Non-JSON: truncate to ~64KB to avoid blowing up tool responses.
    parsedBody = text.length > 65_536 ? `${text.slice(0, 65_536)}…[truncated]` : text
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: parsedBody,
    headers: responseHeaders,
  }
}

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}
