import process from 'node:process'

const chunk = 'x'.repeat(64 * 1024)
for (let index = 0; index < 32; index++)
  process.stdout.write(chunk)
setInterval(() => {}, 1_000)
