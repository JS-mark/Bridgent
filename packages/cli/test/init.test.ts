import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { generateStarterServer, TargetExistsError, writeStarterServer } from '../src/commands/init'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.map(dir => rm(dir, { recursive: true, force: true })))
  tempDirs.length = 0
})

describe('init command helpers', () => {
  it('generates a default server.ts', async () => {
    const cwd = await makeTempDir()

    const result = await writeStarterServer({ cwd })
    const content = await readFile(join(cwd, 'server.ts'), 'utf8')

    expect(result.displayPath).toBe('server.ts')
    expect(result.overwritten).toBe(false)
    expect(content).toContain('import { createStdioServer, defineTool } from \'@bridgent/core\'')
    expect(content).toContain('name: \'echo\'')
    expect(content).toContain('await createStdioServer')
  })

  it('creates parent directories for custom targets', async () => {
    const cwd = await makeTempDir()

    const result = await writeStarterServer({ cwd, file: 'mcp/server.ts' })
    const content = await readFile(join(cwd, 'mcp/server.ts'), 'utf8')

    expect(result.displayPath).toBe('mcp/server.ts')
    expect(content).toContain('name: \'bridgent-starter\'')
  })

  it('refuses to overwrite existing files by default', async () => {
    const cwd = await makeTempDir()
    await writeFile(join(cwd, 'server.ts'), 'keep me', 'utf8')

    await expect(writeStarterServer({ cwd })).rejects.toBeInstanceOf(TargetExistsError)
    await expect(readFile(join(cwd, 'server.ts'), 'utf8')).resolves.toBe('keep me')
  })

  it('overwrites existing files with force', async () => {
    const cwd = await makeTempDir()
    await writeFile(join(cwd, 'server.ts'), 'replace me', 'utf8')

    const result = await writeStarterServer({ cwd, force: true })
    const content = await readFile(join(cwd, 'server.ts'), 'utf8')

    expect(result.overwritten).toBe(true)
    expect(content).toContain('name: \'echo\'')
    expect(content).not.toContain('replace me')
  })

  it('keeps the generated server minimal and editable', () => {
    const content = generateStarterServer()

    expect(content).toContain('import { z } from \'zod\'')
    expect(content).toContain('// eslint-disable-next-line antfu/no-top-level-await')
    expect(content).toContain('tools: [echo]')
    expect(content.split('\n').filter(Boolean)).toHaveLength(16)
  })
})

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'bridgent-init-'))
  tempDirs.push(dir)
  return dir
}
