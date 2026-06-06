import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineCommand } from 'citty'
import { consola } from 'consola'

export const dev = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start an MCP server from a TypeScript or JavaScript file',
  },
  args: {
    file: {
      type: 'positional',
      description: 'Path to the server file (TS or JS)',
      required: true,
    },
  },
  async run({ args }): Promise<void> {
    const file = resolve(process.cwd(), args.file)
    if (!existsSync(file)) {
      consola.error(`File not found: ${file}`)
      process.exit(1)
    }

    const isTs = file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.mts')
    const nodeArgs = isTs
      ? ['--experimental-strip-types', '--no-warnings=ExperimentalWarning', file]
      : [file]

    consola.info(`Starting MCP server: ${file}`)

    const child = spawn(process.execPath, nodeArgs, {
      stdio: 'inherit',
      env: process.env,
    })

    child.on('exit', (code) => {
      process.exit(code ?? 0)
    })

    const forward = (signal: NodeJS.Signals): void => {
      if (!child.killed)
        child.kill(signal)
    }
    process.on('SIGINT', () => forward('SIGINT'))
    process.on('SIGTERM', () => forward('SIGTERM'))
  },
})
