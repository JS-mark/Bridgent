import type { BridgentTool } from '../../src'
import { z } from 'zod'
import { defineTool } from '../../src'

export interface PolicyFixtureRuns {
  read: (input: { id: string }) => unknown | Promise<unknown>
  unsafeWrite: (input: { id: string }) => unknown | Promise<unknown>
  safeWrite: (input: { id: string }) => unknown | Promise<unknown>
  noMetadata: (input: { id: string }) => unknown | Promise<unknown>
}

type PolicyFixtureTool = BridgentTool<{ id: z.ZodString }, unknown>

export interface PolicyFixtureTools {
  read: PolicyFixtureTool
  unsafeWrite: PolicyFixtureTool
  safeWrite: PolicyFixtureTool
  noMetadata: PolicyFixtureTool
}

export function createPolicyFixtureTools(runs: PolicyFixtureRuns): PolicyFixtureTools {
  return {
    read: defineTool({
      name: 'manual_user_get',
      metadata: {
        source: { kind: 'zod', name: 'manual', reference: 'user.get' },
        capability: 'read',
        limits: { rowLimit: 25, outputLimit: 4096 },
      },
      inputSchema: z.object({ id: z.string() }),
      run: runs.read,
    }),
    unsafeWrite: defineTool({
      name: 'openapi_createThing',
      metadata: {
        source: { kind: 'openapi', name: 'fixtures', reference: 'POST /things' },
        capability: 'write',
        safety: {
          requiresAuthOrContext: true,
          hasAudit: false,
          hasPreviewToken: false,
        },
      },
      inputSchema: z.object({ id: z.string() }),
      run: runs.unsafeWrite,
    }),
    safeWrite: defineTool({
      name: 'prisma_user_create',
      metadata: {
        source: { kind: 'prisma', name: 'fixtures', reference: 'User.create' },
        capability: 'write',
        safety: {
          hasAudit: true,
          hasPreviewToken: true,
        },
      },
      inputSchema: z.object({ id: z.string() }),
      run: runs.safeWrite,
    }),
    noMetadata: defineTool({
      name: 'legacy_user_get',
      inputSchema: z.object({ id: z.string() }),
      run: runs.noMetadata,
    }),
  }
}
