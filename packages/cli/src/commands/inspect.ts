import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineCommand } from 'citty'
import { consola } from 'consola'

/**
 * `bridgent inspect <file>` is a thin wrapper around the official MCP Inspector.
 *
 * It spawns Inspector via `pnpm dlx` (falling back to `npx -y` if unavailable)
 * and connects it to the user's server file using stdio. The Inspector opens
 * a browser window letting you list tools, send `tools/call`, and see traces.
 *
 * This is intentionally a thin wrapper — Bridgent's own inspector UI ships
 * later as a differentiated experience.
 */
export const inspect = defineCommand({
  meta: {
    name: 'inspect',
    description: 'Open MCP Inspector and connect it to your server (stdio).',
  },
  args: {
    file: {
      type: 'positional',
      description: 'Path to the server file (TS or JS).',
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
    const targetArgs = isTs
      ? [process.execPath, '--experimental-strip-types', '--no-warnings=ExperimentalWarning', file]
      : [process.execPath, file]

    consola.info('Starting MCP Inspector …')

    // Prefer pnpm dlx (this monorepo uses pnpm); fall back to npx for users
    // running outside a pnpm shell.
    const launcher = pickLauncher()
    if (!launcher) {
      consola.error('Neither `pnpm` nor `npx` is on PATH. Install one of them and try again.')
      process.exit(1)
    }

    const child = spawn(launcher.cmd, [...launcher.args, '@modelcontextprotocol/inspector', ...targetArgs], {
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

function pickLauncher(): { cmd: string, args: string[] } | undefined {
  // We can't synchronously check $PATH cheaply across platforms; pick by
  // env hint, then fall back at spawn time. spawn'll throw ENOENT if missing.
  if (process.env.npm_execpath?.includes('pnpm') || process.env.PNPM_HOME)
    return { cmd: 'pnpm', args: ['dlx'] }
  return { cmd: 'npx', args: ['-y'] }
}
