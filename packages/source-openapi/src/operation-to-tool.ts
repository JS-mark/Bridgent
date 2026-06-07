import type { BridgentTool } from '@bridgent/core'
import type { NormalizedOperation, OpenApiAuth } from './types'
import { defineTool } from '@bridgent/core'
import { z } from 'zod'
import { buildRequest, invokeRequest } from './http'
import { jsonSchemaToZod } from './jsonschema-to-zod'

export interface BuildToolOptions {
  baseUrl: string
  auth?: OpenApiAuth
  fetch: typeof globalThis.fetch
  toolName: string
}

/** Convert a normalized OpenAPI operation into a BridgentTool. */
export function operationToTool(
  op: NormalizedOperation,
  opts: BuildToolOptions,
): BridgentTool {
  const inputSchema = buildInputSchema(op)
  const description = op.summary ?? op.description ?? `${op.method} ${op.path}`

  return defineTool({
    name: opts.toolName,
    description: description.slice(0, 1024),
    inputSchema,
    run: async (args) => {
      const request = buildRequest(op, args as Record<string, unknown>, opts.baseUrl)
      return invokeRequest(request, {
        baseUrl: opts.baseUrl,
        auth: opts.auth,
        fetch: opts.fetch,
      })
    },
  })
}

/** Flatten path/query/header params + body into a single z.object(). */
function buildInputSchema(op: NormalizedOperation): z.ZodObject<z.ZodRawShape> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const param of op.parameters) {
    if (param.in === 'cookie')
      continue
    const baseSchema = jsonSchemaToZod(param.schema ?? { type: 'string' })
    const described = param.description
      ? baseSchema.describe(param.description)
      : baseSchema
    // Avoid name collisions across `in` types: prefix non-path duplicates.
    const key = pickInputKey(shape, param.name, param.in)
    param.inputKey = key
    shape[key] = param.required ? described : described.optional()
  }

  if (op.requestBody) {
    const json = op.requestBody.content?.['application/json']?.schema
    if (json) {
      const bodySchema = jsonSchemaToZod(json)
      shape.body = op.requestBody.required ? bodySchema : bodySchema.optional()
    }
  }

  return z.object(shape)
}

function pickInputKey(
  shape: Record<string, z.ZodTypeAny>,
  name: string,
  location: 'path' | 'query' | 'header' | 'cookie',
): string {
  if (!(name in shape))
    return name
  // path-collisions are unusual; for query/header collisions, prefix to stay unique.
  return `${location}_${name}`
}
