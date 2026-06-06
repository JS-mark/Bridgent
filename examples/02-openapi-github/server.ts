import process from 'node:process'
import { createStdioServer } from '@bridgent/core'
import { fromOpenApi } from '@bridgent/source-openapi'

const token = process.env.GITHUB_TOKEN
if (!token) {
  console.error('Set GITHUB_TOKEN in your environment first (a personal access token works).')
  process.exit(1)
}

// eslint-disable-next-line antfu/no-top-level-await
await createStdioServer({
  name: 'github-readonly',
  version: '0.0.1',
  tools: await fromOpenApi({
    spec: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json',
    namespace: 'gh_',
    auth: { type: 'bearer', token },
    // GitHub spec is huge — narrow to repository-level read paths only.
    pathFilter: /^\/repos\/\{owner\}\/\{repo\}\/(issues|pulls|releases)/,
    // mutating defaults to false → only GET/HEAD operations exposed
  }),
})
