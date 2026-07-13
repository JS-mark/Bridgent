import { initTRPC } from '@trpc/server'
import { initTRPC as initTRPC10 } from 'trpc-server-v10'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { fromTrpc } from '../src/from-trpc'

const t = initTRPC.context<{ userId?: string }>().create()

describe('fromTrpc', () => {
  it('exposes query procedures as tools and executes through createCaller', async () => {
    const router = t.router({
      user: t.router({
        getById: t.procedure
          .input(z.object({ id: z.string() }))
          .query(({ ctx, input }) => ({ id: input.id, userId: ctx.userId })),
      }),
    })

    const tools = fromTrpc({
      router,
      createContext: ({ toolName, procedurePath, procedureKind }) => ({
        userId: `${toolName}:${procedurePath}:${procedureKind}`,
      }),
    })

    expect(tools).toHaveLength(1)
    expect(tools[0]?.name).toBe('trpc_user_getById')
    expect(tools[0]?.metadata).toEqual({
      source: { kind: 'trpc', reference: 'user.getById' },
      capability: 'read',
      safety: { requiresAuthOrContext: true },
    })
    expect(tools[0]?.inputSchema.shape).toHaveProperty('id')
    await expect(tools[0]?.run({ id: 'u1' })).resolves.toEqual({
      ok: true,
      result: {
        id: 'u1',
        userId: 'trpc_user_getById:user.getById:query',
      },
    })
  })

  it('maps no-input procedures to an empty strict object schema and executes with an empty object', async () => {
    const router = t.router({
      ping: t.procedure.query(() => 'pong'),
    })

    const [tool] = fromTrpc({ router })

    expect(tool?.inputSchema.safeParse({}).success).toBe(true)
    expect(tool?.inputSchema.safeParse({ extra: true }).success).toBe(false)
    await expect(tool?.run({})).resolves.toEqual({
      ok: true,
      result: 'pong',
    })
  })

  it('applies procedureFilter before schema generation', () => {
    const router = t.router({
      ok: t.procedure.query(() => 'ok'),
      unsupported: t.procedure.input(z.string()).query(({ input }) => input),
    })

    const tools = fromTrpc({
      router,
      procedureFilter: path => path === 'ok',
    })

    expect(tools.map(tool => tool.name)).toEqual(['trpc_ok'])
  })

  it('rejects non-object input parsers with an actionable error', () => {
    const router = t.router({
      unsupported: t.procedure.input(z.string()).query(({ input }) => input),
    })

    expect(() => fromTrpc({ router })).toThrow('Only Zod v4 object inputs can be exposed')
  })

  it('accepts Zod v4 object-like inputs from another module instance', () => {
    const objectLike = {
      def: {
        type: 'object',
        shape: {
          id: z.string(),
        },
      },
      parse: (input: unknown) => z.object({ id: z.string() }).parse(input),
      type: 'object',
    }
    const router = createFakeRouter({
      'user.getById': {
        kind: 'query',
        inputs: [objectLike],
        run: async input => input,
      },
    })

    const [tool] = fromTrpc({ router })

    expect(tool?.inputSchema.shape).toHaveProperty('id')
    expect(tool?.inputSchema.safeParse({ id: 'u1' }).success).toBe(true)
  })

  it('hides mutations by default and exposes allowlisted mutation tool names', async () => {
    const router = t.router({
      user: t.router({
        getById: t.procedure
          .input(z.object({ id: z.string() }))
          .query(({ input }) => input),
        updateName: t.procedure
          .input(z.object({ id: z.string(), name: z.string() }))
          .mutation(({ input }) => ({ updated: input })),
      }),
    })

    expect(fromTrpc({ router }).map(tool => tool.name)).toEqual(['trpc_user_getById'])

    const tools = fromTrpc({
      router,
      allow: {
        mutating: true,
        tools: ['trpc_user_updateName'],
      },
    })

    expect(tools.map(tool => tool.name)).toEqual(['trpc_user_getById', 'trpc_user_updateName'])
    expect(tools[1]?.metadata).toEqual({
      source: { kind: 'trpc', reference: 'user.updateName' },
      capability: 'write',
      safety: {
        requiresAuthOrContext: false,
        hasAudit: false,
        hasPreviewToken: false,
      },
    })
    await expect(tools[1]?.run({ id: 'u1', name: 'Ada' })).resolves.toEqual({
      ok: true,
      result: {
        updated: {
          id: 'u1',
          name: 'Ada',
        },
      },
    })
  })

  it('requires explicit mutation controls before allowlisting mutation tools', () => {
    const router = t.router({
      updateName: t.procedure
        .input(z.object({ name: z.string() }))
        .mutation(({ input }) => input),
    })

    expect(() => fromTrpc({
      router,
      allow: { tools: ['trpc_updateName'] },
    })).toThrow('allow.mutating: true')

    expect(() => fromTrpc({
      router,
      allow: { mutating: true },
    })).toThrow('allow.tools')
  })

  it('rejects unknown or non-mutation allowlist tool names', () => {
    const router = t.router({
      user: t.router({
        getById: t.procedure.input(z.object({ id: z.string() })).query(({ input }) => input),
        updateName: t.procedure.input(z.object({ name: z.string() })).mutation(({ input }) => input),
      }),
    })

    expect(() => fromTrpc({
      router,
      allow: {
        mutating: true,
        tools: ['trpc_typo'],
      },
    })).toThrow('unknown mutation allowlist tool "trpc_typo"')

    expect(() => fromTrpc({
      router,
      allow: {
        mutating: true,
        tools: ['trpc_user_getById'],
      },
    })).toThrow('unknown mutation allowlist tool "trpc_user_getById"')
  })

  it('supports a real tRPC v10 router runtime shape', async () => {
    const trpc10 = initTRPC10.context<{ userId?: string }>().create()
    const router = trpc10.router({
      user: trpc10.router({
        getById: trpc10.procedure
          .input(z.object({ id: z.string() }))
          .query(({ ctx, input }) => ({ id: input.id, userId: ctx.userId })),
        updateName: trpc10.procedure
          .input(z.object({ name: z.string() }))
          .mutation(({ input }) => ({ updated: input })),
      }),
    })

    expect(fromTrpc({ router }).map(tool => tool.name)).toEqual(['trpc_user_getById'])

    const tools = fromTrpc({
      router,
      allow: {
        mutating: true,
        tools: ['trpc_user_updateName'],
      },
    })

    expect(tools.map(tool => tool.name)).toEqual(['trpc_user_getById', 'trpc_user_updateName'])
    await expect(tools[1]?.run({ name: 'Ada' })).resolves.toEqual({
      ok: true,
      result: {
        updated: {
          name: 'Ada',
        },
      },
    })
  })

  it('detects generated tool name collisions', () => {
    const router = t.router({
      'user profile': t.procedure.query(() => 'space'),
      'user_profile': t.procedure.query(() => 'underscore'),
    })

    expect(() => fromTrpc({ router })).toThrow('duplicate tool name')
  })

  it('does not treat hidden mutation names as exposed collisions', () => {
    const router = t.router({
      'user profile': t.procedure.query(() => 'space'),
      'user_profile': t.procedure.mutation(() => 'underscore'),
    })

    expect(fromTrpc({ router }).map(tool => tool.name)).toEqual(['trpc_user_profile'])
  })

  it('uses custom toolPrefix as the generated name prefix', () => {
    const router = t.router({
      user: t.router({
        getById: t.procedure.input(z.object({ id: z.string() })).query(({ input }) => input),
      }),
    })

    const [tool] = fromTrpc({ router, toolPrefix: 'app' })

    expect(tool?.name).toBe('app_user_getById')
  })
})

function createFakeRouter(
  procedures: Record<string, {
    inputs: unknown[]
    kind: 'query' | 'mutation' | 'subscription'
    run: (input: unknown) => Promise<unknown>
    version?: 10 | 11
  }>,
): {
  _def: { procedures: Record<string, unknown> }
  createCaller: () => Record<string, unknown>
} {
  const flatProcedures: Record<string, unknown> = {}
  const caller: Record<string, unknown> = {}

  for (const [path, config] of Object.entries(procedures)) {
    const def = config.version === 10
      ? {
          inputs: config.inputs,
          [config.kind]: true,
        }
      : {
          inputs: config.inputs,
          type: config.kind,
        }
    flatProcedures[path] = Object.assign(async () => undefined, { _def: def })
    assignNested(caller, path, config.run)
  }

  return {
    _def: {
      procedures: flatProcedures,
    },
    createCaller: () => caller,
  }
}

function assignNested(target: Record<string, unknown>, path: string, run: (input: unknown) => Promise<unknown>): void {
  const segments = path.split('.')
  const leaf = segments[segments.length - 1]
  if (!leaf)
    throw new Error(`invalid test procedure path "${path}"`)

  let current = target
  for (const segment of segments.slice(0, -1)) {
    const next = current[segment]
    if (!next || typeof next !== 'object') {
      current[segment] = {}
    }
    current = current[segment] as Record<string, unknown>
  }
  current[leaf] = run
}
