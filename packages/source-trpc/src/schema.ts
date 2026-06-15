import type { TrpcProcedureLike } from './introspection'
import { z } from 'zod'

export function procedureInputSchema(
  procedure: TrpcProcedureLike,
  path: string,
): z.ZodObject<z.ZodRawShape> {
  const inputs = procedure._def?.inputs ?? []
  if (inputs.length === 0)
    return z.object({}).strict()

  let schema: z.ZodObject<z.ZodRawShape> = z.object({})
  for (const input of inputs) {
    const shape = zodObjectShape(input)
    if (!shape) {
      throw new TypeError(
        `@bridgent/source-trpc: unsupported input parser for "${path}". `
        + 'Only Zod v4 object inputs can be exposed as MCP tool schemas; filter this procedure out or wrap its input in z.object(...).',
      )
    }
    schema = schema.merge(z.object(shape))
  }

  return schema
}

function zodObjectShape(input: unknown): z.ZodRawShape | undefined {
  if (!input || (typeof input !== 'object' && typeof input !== 'function'))
    return undefined

  if (input instanceof z.ZodObject)
    return input.shape

  const candidate = input as {
    def?: { type?: unknown, shape?: unknown }
    parse?: unknown
    shape?: unknown
    type?: unknown
  }

  if (candidate.type !== 'object' && candidate.def?.type !== 'object')
    return undefined
  if (typeof candidate.parse !== 'function')
    return undefined

  const shape = candidate.shape ?? candidate.def?.shape
  if (!shape || typeof shape !== 'object')
    return undefined

  return shape as z.ZodRawShape
}
