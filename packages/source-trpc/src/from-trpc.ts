import type { BridgentTool } from '@bridgent/core'
import type { TrpcProcedureInfo } from './introspection'
import type { FromTrpcOptions, TrpcToolResult } from './types'
import { defineTool } from '@bridgent/core'
import { listProcedures } from './introspection'
import { procedureInputSchema } from './schema'
import { procedureToToolName } from './slug'

export function fromTrpc(options: FromTrpcOptions): BridgentTool[] {
  validateMutationOptions(options)

  const tools: BridgentTool[] = []
  const seen = new Set<string>()
  const allowedMutationTools = new Set(options.allow?.tools ?? [])
  const procedures = listProcedures(options.router)
    .filter(procedure => procedurePasses(procedure.path, options))
  validateAllowedMutationTools(procedures, options)

  for (const procedure of procedures) {
    const toolName = procedureToToolName({ path: procedure.path, toolPrefix: options.toolPrefix })
    if (procedure.kind === 'subscription')
      continue
    if (procedure.kind === 'mutation' && !allowedMutationTools.has(toolName))
      continue

    if (seen.has(toolName))
      throw new Error(`@bridgent/source-trpc: duplicate tool name "${toolName}". Provide a different toolPrefix or filter one procedure.`)
    seen.add(toolName)

    const isMutation = procedure.kind === 'mutation'
    tools.push(defineTool({
      name: toolName,
      description: `${procedure.kind} tRPC procedure ${procedure.path}`,
      metadata: {
        source: {
          kind: 'trpc',
          ...(options.toolPrefix ? { name: options.toolPrefix } : {}),
          reference: procedure.path,
        },
        capability: isMutation ? 'write' : 'read',
        safety: {
          requiresAuthOrContext: typeof options.createContext === 'function',
          ...(isMutation ? { hasAudit: false, hasPreviewToken: false } : {}),
        },
      },
      inputSchema: procedureInputSchema(procedure.procedure, procedure.path),
      run: async (args): Promise<TrpcToolResult> => {
        try {
          const context = options.createContext
            ? await options.createContext({
                toolName,
                procedurePath: procedure.path,
                procedureKind: procedure.kind,
              })
            : {}
          const caller = options.router.createCaller(context)
          const callable = getCallableProcedure(caller, procedure.path)
          const result = await callable(args)
          return { ok: true, result }
        }
        catch (error) {
          return {
            ok: false,
            error: {
              kind: 'trpc',
              message: error instanceof Error ? error.message : String(error),
            },
          }
        }
      },
    }))
  }

  return tools
}

function validateMutationOptions(options: FromTrpcOptions): void {
  if (!options.allow?.mutating) {
    if (options.allow?.tools?.length)
      throw new Error('@bridgent/source-trpc: `allow.mutating: true` is required when mutation tools are allowlisted.')
    return
  }

  if (!Array.isArray(options.allow.tools) || options.allow.tools.length === 0)
    throw new Error('@bridgent/source-trpc: `allow.tools` must be a non-empty array of final generated mutation tool names when `allow.mutating` is true.')
}

function validateAllowedMutationTools(
  procedures: TrpcProcedureInfo[],
  options: FromTrpcOptions,
): void {
  if (!options.allow?.mutating)
    return

  const mutationToolNames = new Set(
    procedures
      .filter(procedure => procedure.kind === 'mutation')
      .map(procedure => procedureToToolName({ path: procedure.path, toolPrefix: options.toolPrefix })),
  )

  for (const toolName of options.allow.tools ?? []) {
    if (!mutationToolNames.has(toolName)) {
      throw new Error(
        `@bridgent/source-trpc: unknown mutation allowlist tool "${toolName}". `
        + 'Use final generated tool names for mutation procedures that pass procedureFilter.',
      )
    }
  }
}

function procedurePasses(path: string, options: FromTrpcOptions): boolean {
  if (!options.procedureFilter)
    return true
  return options.procedureFilter instanceof RegExp
    ? options.procedureFilter.test(path)
    : options.procedureFilter(path)
}

function getCallableProcedure(caller: unknown, path: string): (input: unknown) => Promise<unknown> {
  let current = caller
  for (const segment of path.split('.')) {
    if (!current || (typeof current !== 'object' && typeof current !== 'function'))
      throw new Error(`@bridgent/source-trpc: caller is missing procedure "${path}".`)
    current = (current as Record<string, unknown>)[segment]
    if (current === undefined)
      throw new Error(`@bridgent/source-trpc: caller is missing procedure "${path}".`)
  }

  if (typeof current !== 'function')
    throw new Error(`@bridgent/source-trpc: caller procedure "${path}" is not callable.`)

  return current as (input: unknown) => Promise<unknown>
}
