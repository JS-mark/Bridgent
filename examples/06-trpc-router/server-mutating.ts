import { createStdioServer } from '@bridgent/core'
import { fromTrpc } from '@bridgent/source-trpc'
import { appRouter } from './router.ts'

// eslint-disable-next-line antfu/no-top-level-await
await createStdioServer({
  name: 'trpc-router-mutating',
  version: '0.0.1',
  tools: fromTrpc({
    router: appRouter,
    createContext: () => ({ userId: 'demo-user' }),
    allow: {
      mutating: true,
      tools: ['trpc_user_updateName'],
    },
  }),
})
