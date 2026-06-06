import type { BridgentTool } from '@bridgent/core'
import type { FromOpenApiOptions, HttpMethod, NormalizedOperation, OperationObject, ParameterObject, RequestBodyObject } from './types'
import { shouldExposeOperation } from './filter'
import { operationToTool } from './operation-to-tool'
import { parseOpenApi } from './parse-openapi'
import { operationToToolName } from './slug'

const HTTP_METHODS: readonly HttpMethod[] = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

/**
 * Turn an OpenAPI 3.x spec into a list of BridgentTools, ready to feed into
 * `createStdioServer({ tools })`.
 *
 * Read-only by default — to expose mutating operations, set `allow.mutating: true`
 * (or use `allowOperations` allowlist).
 */
export async function fromOpenApi(
  options: FromOpenApiOptions,
): Promise<BridgentTool[]> {
  const { document } = await parseOpenApi(options.spec)

  const baseUrl = options.baseUrl ?? extractBaseUrl(document)
  if (!baseUrl)
    throw new Error('No baseUrl could be determined from the spec; pass `baseUrl` explicitly.')

  const fetchImpl = options.fetch ?? globalThis.fetch
  if (!fetchImpl)
    throw new Error('No fetch implementation available. Pass `options.fetch` or run on Node ≥ 22.18.')

  const tools: BridgentTool[] = []
  const seenNames = new Set<string>()

  const paths = (document.paths ?? {}) as Record<string, Record<string, OperationObject>>

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object')
      continue

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method.toLowerCase()] as OperationObject | undefined
      if (!operation)
        continue

      const ctx = { path, method, operation }
      if (!shouldExposeOperation(ctx, options))
        continue

      const normalized = normalizeOperation(path, method, operation)
      const toolName = operationToToolName({
        operationId: normalized.operationId,
        method: normalized.method,
        path: normalized.path,
        namespace: options.namespace,
      })

      if (seenNames.has(toolName)) {
        throw new Error(
          `Duplicate tool name "${toolName}" generated. `
          + `Provide a \`namespace\` option, or rename the operationId in the spec.`,
        )
      }
      seenNames.add(toolName)

      tools.push(operationToTool(normalized, {
        baseUrl,
        auth: options.auth,
        fetch: fetchImpl,
        toolName,
      }))
    }
  }

  return tools
}

function normalizeOperation(
  path: string,
  method: HttpMethod,
  raw: OperationObject,
): NormalizedOperation {
  return {
    operationId: raw.operationId ?? `${method.toLowerCase()}_${path}`,
    method,
    path,
    summary: raw.summary,
    description: raw.description,
    parameters: (raw.parameters ?? []) as ParameterObject[],
    requestBody: raw.requestBody as RequestBodyObject | undefined,
    raw,
  }
}

function extractBaseUrl(document: Record<string, any>): string | undefined {
  const servers = document.servers as Array<{ url?: string }> | undefined
  return servers?.[0]?.url
}
