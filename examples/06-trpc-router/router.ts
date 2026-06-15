import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const users = new Map([
  ['u1', { id: 'u1', name: 'Ada Lovelace' }],
  ['u2', { id: 'u2', name: 'Grace Hopper' }],
])

const t = initTRPC.context<{ userId: string }>().create()

export const appRouter = t.router({
  user: t.router({
    getById: t.procedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => users.get(input.id) ?? null),

    updateName: t.procedure
      .input(z.object({ id: z.string(), name: z.string().min(1) }))
      .mutation(({ input, ctx }) => {
        const next = { id: input.id, name: input.name, updatedBy: ctx.userId }
        users.set(input.id, next)
        return next
      }),
  }),
})

export type AppRouter = typeof appRouter
