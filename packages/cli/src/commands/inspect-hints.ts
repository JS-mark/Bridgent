import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import process from 'node:process'

const SUMMARY_ENV = 'BRIDGENT_INSPECT_HINTS'
const SUMMARY_PREFIX = '__BRIDGENT_INSPECT_SUMMARY__'
const LARGE_TOOL_COUNT = 50
const MAX_TOOLS_PER_GROUP = 10
const MAX_PROBE_STDOUT_BYTES = 1024 * 1024
const TERMINATION_GRACE_MS = 250

export interface InspectSummary {
  name: string
  version: string
  transport?: InspectSummaryTransport
  tools: InspectSummaryTool[]
}

export type InspectSummaryTransport = { kind: 'stdio' } | { kind: 'http', host: string, port: number, path: string } | { kind: 'web' }

export interface InspectSummaryTool {
  name: string
  description?: string
  metadata?: {
    source: {
      kind: string
      name?: string
      reference?: string
    }
    capability: 'read' | 'write'
    safety?: {
      requiresAuthOrContext?: boolean
      hasAudit?: boolean
      hasPreviewToken?: boolean
    }
    limits?: {
      rowLimit?: number
      outputLimit?: number
    }
  }
}

export interface InspectHintLines {
  info: string[]
  warnings: string[]
}

export function nodeArgsForFile(file: string): string[] {
  return file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.mts')
    ? ['--experimental-strip-types', '--no-warnings=ExperimentalWarning', file]
    : [file]
}

export async function collectInspectSummary(file: string, timeoutMs = 2_500): Promise<InspectSummary | undefined> {
  const nodeArgs = nodeArgsForFile(file)

  return await new Promise((resolve) => {
    let settled = false
    let stdout = ''
    let timer: ReturnType<typeof setTimeout> | undefined
    let forceKillTimer: ReturnType<typeof setTimeout> | undefined
    const child = spawn(process.execPath, nodeArgs, {
      stdio: ['ignore', 'pipe', 'ignore'],
      env: {
        ...process.env,
        [SUMMARY_ENV]: '1',
      },
    })

    const settle = (summary: InspectSummary | undefined): void => {
      if (settled)
        return
      settled = true
      if (timer)
        clearTimeout(timer)
      if (forceKillTimer)
        clearTimeout(forceKillTimer)
      resolve(summary)
    }

    const terminate = (): void => {
      child.kill('SIGTERM')
      forceKillTimer = setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null)
          child.kill('SIGKILL')
        settle(undefined)
      }, TERMINATION_GRACE_MS)
    }

    timer = setTimeout(terminate, timeoutMs)

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
      if (Buffer.byteLength(stdout, 'utf8') > MAX_PROBE_STDOUT_BYTES) {
        terminate()
        return
      }

      const summary = parseInspectSummary(stdout)
      if (summary)
        settle(summary)
    })
    child.on('error', () => settle(undefined))
    child.on('close', () => settle(parseInspectSummary(stdout)))
  })
}

export function parseInspectSummary(output: string): InspectSummary | undefined {
  const line = output
    .split(/\r?\n/)
    .find(candidate => candidate.startsWith(SUMMARY_PREFIX))
  if (!line)
    return undefined

  try {
    const parsed = JSON.parse(line.slice(SUMMARY_PREFIX.length)) as unknown
    if (!isInspectSummary(parsed))
      return undefined
    return parsed
  }
  catch {
    return undefined
  }
}

function isInspectSummary(value: unknown): value is InspectSummary {
  if (!isRecord(value))
    return false
  return typeof value.name === 'string'
    && typeof value.version === 'string'
    && isInspectTransport(value.transport)
    && Array.isArray(value.tools)
    && value.tools.every(isInspectSummaryTool)
}

function isInspectSummaryTool(value: unknown): value is InspectSummaryTool {
  if (!isRecord(value) || typeof value.name !== 'string')
    return false
  if (value.description !== undefined && typeof value.description !== 'string')
    return false
  return value.metadata === undefined || isInspectSummaryMetadata(value.metadata)
}

function isInspectSummaryMetadata(value: unknown): value is InspectSummaryTool['metadata'] {
  if (!isRecord(value) || !isRecord(value.source))
    return false
  if (typeof value.source.kind !== 'string')
    return false
  if (value.source.name !== undefined && typeof value.source.name !== 'string')
    return false
  if (value.source.reference !== undefined && typeof value.source.reference !== 'string')
    return false
  if (value.capability !== 'read' && value.capability !== 'write')
    return false
  if (value.safety !== undefined && !isRecord(value.safety))
    return false
  if (value.limits !== undefined && !isRecord(value.limits))
    return false
  return true
}

function isInspectTransport(value: unknown): value is InspectSummaryTransport | undefined {
  if (value === undefined)
    return true
  if (!isRecord(value) || typeof value.kind !== 'string')
    return false
  if (value.kind === 'stdio' || value.kind === 'web')
    return true
  return value.kind === 'http'
    && typeof value.host === 'string'
    && typeof value.port === 'number'
    && typeof value.path === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function formatInspectHints(summary: InspectSummary | undefined, file: string, probeAttempted = true): InspectHintLines {
  const info = [
    ...hostSnippetLines(file, summary?.transport),
  ]
  const warnings: string[] = []

  if (!summary) {
    info.push(probeAttempted
      ? 'Metadata hints unavailable; continuing with the official MCP Inspector.'
      : 'Metadata probe not run. Use --probe only when server initialization is safe to execute twice.')
    return { info, warnings }
  }

  info.unshift(`Server: ${summary.name}@${summary.version}`)
  info.push(`Tools: ${summary.tools.length}`)
  info.push(...sourceGroupLines(summary.tools))

  const writeTools = summary.tools.filter(tool => tool.metadata?.capability === 'write')
  if (writeTools.length > 0)
    warnings.push(`Mutating tools enabled (${writeTools.length}): ${toolNameList(writeTools)}`)

  const missingAudit = writeTools.filter(tool => tool.metadata?.safety?.hasAudit !== true)
  if (missingAudit.length > 0)
    warnings.push(`Mutating tools without audit metadata (${missingAudit.length}): ${toolNameList(missingAudit)}`)

  if (summary.tools.length > LARGE_TOOL_COUNT)
    warnings.push(`Large generated tool surface (${summary.tools.length}); consider source filters or namespaces.`)

  return { info, warnings }
}

function sourceGroupLines(tools: InspectSummaryTool[]): string[] {
  const groups = new Map<string, InspectSummaryTool[]>()
  for (const tool of tools) {
    const source = tool.metadata?.source
    const group = source
      ? `${source.kind}${source.name ? `:${source.name}` : ''}`
      : 'unknown'
    groups.set(group, [...(groups.get(group) ?? []), tool])
  }

  const lines: string[] = []
  for (const [group, groupedTools] of groups) {
    const reads = groupedTools.filter(tool => tool.metadata?.capability === 'read').length
    const writes = groupedTools.filter(tool => tool.metadata?.capability === 'write').length
    const unknown = groupedTools.filter(tool => tool.metadata?.capability === undefined).length
    const unknownSuffix = unknown > 0 ? `, ${unknown} unknown` : ''
    lines.push(`Source ${group}: ${groupedTools.length} tools (${reads} read, ${writes} write${unknownSuffix})`)
    for (const tool of groupedTools.slice(0, MAX_TOOLS_PER_GROUP)) {
      const capability = tool.metadata?.capability ?? 'unknown'
      const reference = tool.metadata?.source.reference ? ` ${tool.metadata.source.reference}` : ''
      lines.push(`  - ${tool.name} [${capability}]${reference}`)
    }
    if (groupedTools.length > MAX_TOOLS_PER_GROUP)
      lines.push(`  ... ${groupedTools.length - MAX_TOOLS_PER_GROUP} more tools`)
  }
  return lines
}

function hostSnippetLines(file: string, transport?: InspectSummaryTransport): string[] {
  const lines = [
    `Host config (stdio): ${JSON.stringify({ mcpServers: { bridgent: { command: 'bridgent', args: ['dev', file] } } })}`,
  ]
  if (transport?.kind === 'http') {
    lines.push(`Host config (HTTP detected): ${JSON.stringify({ mcpServers: { bridgent: { transport: 'streamable-http', url: httpUrl(transport) } } })}`)
    if (transport.host === '0.0.0.0')
      lines.push('HTTP server binds to 0.0.0.0; connect with 127.0.0.1 locally or another reachable interface address.')
  }
  else {
    lines.push(`Host config (HTTP defaults): ${JSON.stringify({ mcpServers: { bridgent: { transport: 'streamable-http', url: 'http://127.0.0.1:3333/mcp' } } })}`)
  }
  if (transport?.kind === 'web')
    lines.push('Detected Web handler: configure the URL from the runtime that mounts this fetch handler.')
  return lines
}

function httpUrl(transport: Extract<InspectSummaryTransport, { kind: 'http' }>): string {
  const host = transport.host === '0.0.0.0' ? '127.0.0.1' : transport.host
  return `http://${host}:${transport.port}${transport.path}`
}

function toolNameList(tools: InspectSummaryTool[]): string {
  const names = tools.slice(0, 8).map(tool => tool.name)
  return tools.length > names.length
    ? `${names.join(', ')}, ...`
    : names.join(', ')
}
