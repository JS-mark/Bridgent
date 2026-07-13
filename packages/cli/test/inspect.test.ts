import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { collectInspectSummary, formatInspectHints, nodeArgsForFile, parseInspectSummary } from '../src/commands/inspect-hints'

describe('inspect command helpers', () => {
  it('uses Node strip-types for TypeScript server files', () => {
    expect(nodeArgsForFile('/tmp/server.ts')).toEqual([
      '--experimental-strip-types',
      '--no-warnings=ExperimentalWarning',
      '/tmp/server.ts',
    ])
    expect(nodeArgsForFile('/tmp/server.mjs')).toEqual(['/tmp/server.mjs'])
  })

  it('parses sentinel summary lines and ignores unrelated output', () => {
    expect(parseInspectSummary([
      'user log',
      '__BRIDGENT_INSPECT_SUMMARY__{"name":"app","version":"1.0.0","transport":{"kind":"stdio"},"tools":[]}',
    ].join('\n'))).toEqual({ name: 'app', version: '1.0.0', transport: { kind: 'stdio' }, tools: [] })

    expect(parseInspectSummary('__BRIDGENT_INSPECT_SUMMARY__not-json')).toBeUndefined()
    expect(parseInspectSummary('no sentinel')).toBeUndefined()
    expect(parseInspectSummary([
      '__BRIDGENT_INSPECT_SUMMARY__',
      '{"name":"app","version":"1.0.0","tools":[{"name":"bad","metadata":{"capability":"write"}}]}',
    ].join(''))).toBeUndefined()
  })

  it('formats source groups, host snippets, and risky surface warnings', () => {
    const hints = formatInspectHints({
      name: 'app',
      version: '1.0.0',
      tools: [
        {
          name: 'trpc_user_getById',
          metadata: {
            source: { kind: 'trpc', reference: 'user.getById' },
            capability: 'read',
          },
        },
        {
          name: 'trpc_user_updateName',
          metadata: {
            source: { kind: 'trpc', reference: 'user.updateName' },
            capability: 'write',
            safety: { hasAudit: false },
          },
        },
      ],
    }, '/tmp/my server.ts')

    expect(hints.info).toContain('Server: app@1.0.0')
    expect(hints.info).toContain('Tools: 2')
    expect(hints.info).toContain('Source trpc: 2 tools (1 read, 1 write)')
    expect(hints.info).toContain('  - trpc_user_getById [read] user.getById')
    expect(hints.info.join('\n')).toContain('"args":["dev","/tmp/my server.ts"]')
    expect(hints.info.join('\n')).toContain('http://127.0.0.1:3333/mcp')
    expect(hints.warnings).toEqual([
      'Mutating tools enabled (1): trpc_user_updateName',
      'Mutating tools without audit metadata (1): trpc_user_updateName',
    ])
  })

  it('warns on large generated tool counts', () => {
    const hints = formatInspectHints({
      name: 'app',
      version: '1.0.0',
      tools: Array.from({ length: 51 }, (_, index) => ({
        name: `tool_${index}`,
        metadata: {
          source: { kind: 'openapi', reference: `GET /${index}` },
          capability: 'read' as const,
        },
      })),
    }, '/tmp/server.ts')

    expect(hints.warnings).toEqual([
      'Large generated tool surface (51); consider source filters or namespaces.',
    ])
    expect(hints.info).toContain('  ... 41 more tools')
  })

  it('keeps metadata-less tools unknown instead of read', () => {
    const hints = formatInspectHints({
      name: 'app',
      version: '1.0.0',
      tools: [{ name: 'manual_mutation' }],
    }, '/tmp/server.ts')

    expect(hints.info).toContain('Source unknown: 1 tools (0 read, 0 write, 1 unknown)')
    expect(hints.info).toContain('  - manual_mutation [unknown]')
    expect(hints.warnings).toEqual([])
  })

  it('uses detected HTTP transport details when available', () => {
    const hints = formatInspectHints({
      name: 'app',
      version: '1.0.0',
      transport: { kind: 'http', host: '0.0.0.0', port: 4444, path: '/api/mcp' },
      tools: [],
    }, '/tmp/server.ts')

    expect(hints.info.join('\n')).toContain('Host config (HTTP detected)')
    expect(hints.info.join('\n')).toContain('http://127.0.0.1:4444/api/mcp')
    expect(hints.info).toContain('HTTP server binds to 0.0.0.0; connect with 127.0.0.1 locally or another reachable interface address.')
  })

  it('prints a Web handler mounting hint when detected', () => {
    const hints = formatInspectHints({
      name: 'app',
      version: '1.0.0',
      transport: { kind: 'web' },
      tools: [],
    }, '/tmp/server.ts')

    expect(hints.info).toContain('Detected Web handler: configure the URL from the runtime that mounts this fetch handler.')
  })

  it('falls back quietly when metadata probing is unavailable', () => {
    const hints = formatInspectHints(undefined, '/tmp/server.ts')

    expect(hints.info).toContain('Metadata hints unavailable; continuing with the official MCP Inspector.')
    expect(hints.warnings).toEqual([])
  })

  it('explains that metadata probing is opt-in', () => {
    const hints = formatInspectHints(undefined, '/tmp/server.ts', false)

    expect(hints.info).toContain('Metadata probe not run. Use --probe only when server initialization is safe to execute twice.')
    expect(hints.warnings).toEqual([])
  })

  it('force-kills a probe that ignores SIGTERM', async () => {
    const fixture = fileURLToPath(new URL('./fixtures/ignore-sigterm.mjs', import.meta.url))
    const startedAt = Date.now()

    await expect(collectInspectSummary(fixture, 20)).resolves.toBeUndefined()
    expect(Date.now() - startedAt).toBeLessThan(1_000)
  })

  it('terminates a probe whose stdout exceeds the capture limit', async () => {
    const fixture = fileURLToPath(new URL('./fixtures/noisy-stdout.mjs', import.meta.url))
    const startedAt = Date.now()

    await expect(collectInspectSummary(fixture)).resolves.toBeUndefined()
    expect(Date.now() - startedAt).toBeLessThan(1_500)
  })
})
