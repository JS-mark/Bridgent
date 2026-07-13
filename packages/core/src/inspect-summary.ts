import type { BridgentTool } from './define-tool'
import { writeSync } from 'node:fs'
import process from 'node:process'

export const BRIDGENT_INSPECT_SUMMARY_ENV = 'BRIDGENT_INSPECT_HINTS'
export const BRIDGENT_INSPECT_SUMMARY_PREFIX = '__BRIDGENT_INSPECT_SUMMARY__'

export interface BridgentInspectSummary {
  name: string
  version: string
  transport?: BridgentInspectTransport
  tools: BridgentInspectSummaryTool[]
}

export type BridgentInspectTransport = { kind: 'stdio' } | { kind: 'http', host: string, port: number, path: string } | { kind: 'web' }

export interface BridgentInspectSummaryTool {
  name: string
  description?: string
  metadata?: BridgentTool['metadata']
}

export interface CreateInspectSummaryOptions {
  name: string
  version: string
  tools: BridgentTool<any, any>[]
}

export function createInspectSummary(opts: CreateInspectSummaryOptions, transport?: BridgentInspectTransport): BridgentInspectSummary {
  return {
    name: opts.name,
    version: opts.version,
    ...(transport ? { transport } : {}),
    tools: opts.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      metadata: tool.metadata,
    })),
  }
}

export function maybeEmitInspectSummary(opts: CreateInspectSummaryOptions, transport?: BridgentInspectTransport): boolean {
  if (process.env[BRIDGENT_INSPECT_SUMMARY_ENV] !== '1')
    return false

  writeSync(1, `${BRIDGENT_INSPECT_SUMMARY_PREFIX}${JSON.stringify(createInspectSummary(opts, transport))}\n`)
  process.exit(0)
}
