import { defineCommand, runMain } from 'citty'
import { dev } from './commands/dev'
import { inspect } from './commands/inspect'
import { serve } from './commands/serve'

const main = defineCommand({
  meta: {
    name: 'bridgent',
    version: '0.0.1',
    description: 'Expose your existing APIs, databases, and code as MCP servers',
  },
  subCommands: {
    dev,
    serve,
    inspect,
  },
})

runMain(main)
