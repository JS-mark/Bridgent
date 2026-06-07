import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import process from 'node:process'
import { defineCommand } from 'citty'
import { consola } from 'consola'

export interface WriteStarterServerOptions {
  cwd: string
  file?: string
  force?: boolean
}

export interface WriteStarterServerResult {
  filePath: string
  displayPath: string
  overwritten: boolean
}

export class TargetExistsError extends Error {
  constructor(readonly filePath: string) {
    super(`Target file already exists: ${filePath}`)
    this.name = 'TargetExistsError'
  }
}

export const init = defineCommand({
  meta: {
    name: 'init',
    description: 'Create a starter Bridgent MCP server file.',
  },
  args: {
    file: {
      type: 'positional',
      description: 'Path to write the starter server file.',
      required: false,
    },
    force: {
      type: 'boolean',
      description: 'Overwrite the target file if it already exists.',
      alias: 'f',
    },
  },
  async run({ args }): Promise<void> {
    try {
      const result = await writeStarterServer({
        cwd: process.cwd(),
        file: typeof args.file === 'string' ? args.file : undefined,
        force: Boolean(args.force),
      })

      const action = result.overwritten ? 'Updated' : 'Created'
      consola.success(`${action} ${result.displayPath}`)
      consola.info('Install packages if needed: pnpm add @bridgent/core zod && pnpm add -D @bridgent/cli')
      consola.info(`Run locally: bridgent dev ${result.displayPath}`)
      consola.info(`Inspect tools: bridgent inspect ${result.displayPath}`)
    }
    catch (error) {
      if (error instanceof TargetExistsError) {
        consola.error(`File already exists: ${toDisplayPath(process.cwd(), error.filePath)}`)
        consola.info('Use --force to overwrite it.')
        process.exit(1)
      }
      throw error
    }
  },
})

export async function writeStarterServer(options: WriteStarterServerOptions): Promise<WriteStarterServerResult> {
  const filePath = resolve(options.cwd, options.file || 'server.ts')
  const exists = await pathExists(filePath)

  if (exists && !options.force)
    throw new TargetExistsError(filePath)

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, generateStarterServer(), 'utf8')

  return {
    filePath,
    displayPath: toDisplayPath(options.cwd, filePath),
    overwritten: exists,
  }
}

export function generateStarterServer(): string {
  return `import { createStdioServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

const echo = defineTool({
  name: 'echo',
  description: 'Echo a message back',
  inputSchema: z.object({
    message: z.string().describe('Message to echo'),
  }),
  run: ({ message }) => ({ message }),
})

// eslint-disable-next-line antfu/no-top-level-await
await createStdioServer({
  name: 'bridgent-starter',
  version: '0.1.0',
  tools: [echo],
})
`
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  }
  catch {
    return false
  }
}

function toDisplayPath(cwd: string, filePath: string): string {
  const displayPath = relative(cwd, filePath)
  return displayPath && !displayPath.startsWith('..') ? displayPath : filePath
}
