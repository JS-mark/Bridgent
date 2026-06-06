import { createStdioServer } from '@bridgent/core'
import { fromOpenApi } from '@bridgent/source-openapi'

// eslint-disable-next-line antfu/no-top-level-await
await createStdioServer({
  name: 'petstore',
  version: '0.0.1',
  tools: await fromOpenApi({
    spec: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.1/petstore.yaml',
    // mutating defaults to false → only GET/HEAD operations are exposed
  }),
})
