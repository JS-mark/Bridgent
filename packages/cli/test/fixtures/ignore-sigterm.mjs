import process from 'node:process'

process.on('SIGTERM', () => {
  // Intentionally ignored to exercise the force-kill fallback.
})
setInterval(() => {}, 1_000)
