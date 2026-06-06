import type { BridgentTool } from '@bridgent/core'
import type { PrismaMethod } from '../types'
import type { ToolFactoryArgs } from './find-many'
import { createAggregateTool } from './aggregate'
import { createCountTool } from './count'
import { createFindFirstTool } from './find-first'
import { createFindManyTool } from './find-many'
import { createFindUniqueTool } from './find-unique'

const READ_FACTORIES: Partial<Record<PrismaMethod, (args: ToolFactoryArgs) => BridgentTool>> = {
  findMany: createFindManyTool,
  findFirst: createFindFirstTool,
  findUnique: createFindUniqueTool,
  count: createCountTool,
  aggregate: createAggregateTool,
}

export function createReadTool(method: PrismaMethod, args: ToolFactoryArgs): BridgentTool | undefined {
  const factory = READ_FACTORIES[method]
  return factory ? factory(args) : undefined
}

export type { ToolFactoryArgs }
