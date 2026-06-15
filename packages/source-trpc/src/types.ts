export type TrpcProcedureKind = 'query' | 'mutation' | 'subscription'

export interface FromTrpcOptions {
  router: TrpcRouterLike
  createContext?: (input: TrpcCreateContextInput) => unknown | Promise<unknown>
  toolPrefix?: string
  procedureFilter?: RegExp | ((path: string) => boolean)
  allow?: {
    mutating?: boolean
    /** Final generated tool names allowed for mutation exposure. Non-empty when mutating is true. */
    tools?: string[]
  }
}

export interface TrpcCreateContextInput {
  toolName: string
  procedurePath: string
  procedureKind: TrpcProcedureKind
}

export interface TrpcRouterLike {
  createCaller: (context: any) => unknown
  _def?: {
    procedures?: Record<string, unknown>
    record?: Record<string, unknown>
  }
}

export interface TrpcToolResult<T = unknown> {
  ok: boolean
  result?: T
  error?: {
    kind: 'trpc' | 'unsupported' | 'unknown'
    message: string
  }
}
