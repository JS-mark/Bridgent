import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { describe, expect, it } from 'vitest'

/**
 * CLI smoke test — spawns `bridgent dev <example>` like a real user would,
 * exercising the full CLI binary → strip-types → @bridgent/core → MCP loop.
 *
 * Requires `bridgent` (the CLI) to be built. `turbo` ensures `^build` runs
 * before `test` so the cli `dist/cli.mjs` should exist.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '../../..')
const CLI_BIN = resolve(REPO_ROOT, 'packages/cli/dist/cli.mjs')
const EXAMPLE_01 = resolve(REPO_ROOT, 'examples/01-zod-hello/server.ts')

describe('cli smoke (bridgent dev)', () => {
  it('boots example 01-zod-hello via bridgent dev and serves tools', async () => {
    if (!existsSync(CLI_BIN))
      throw new Error(`bridgent CLI not built at ${CLI_BIN}. Run \`pnpm --filter bridgent build\` first.`)
    if (!existsSync(EXAMPLE_01))
      throw new Error(`Missing fixture: ${EXAMPLE_01}`)

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [CLI_BIN, 'dev', EXAMPLE_01],
      cwd: dirname(EXAMPLE_01),
    })
    const client = new Client({ name: 'cli-smoke', version: '0.0.1' }, { capabilities: {} })

    try {
      await client.connect(transport)
      const list = await client.listTools()
      expect(list.tools.map(t => t.name).sort()).toEqual(['add', 'echo'])

      const sum = await client.callTool({
        name: 'add',
        arguments: { a: 12, b: 30 },
      }) as { content: { type: string, text: string }[] }
      expect(sum.content[0]?.text).toContain('42')

      const echo = await client.callTool({
        name: 'echo',
        arguments: { message: 'cli-ok' },
      }) as { content: { type: string, text: string }[] }
      expect(echo.content[0]?.text).toBe('cli-ok')
    }
    finally {
      await client.close().catch(() => {})
    }
  }, 20_000)
})
