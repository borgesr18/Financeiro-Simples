// instrumentation.ts
export async function register() {
  process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err)
  })
  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason)
  })
}
