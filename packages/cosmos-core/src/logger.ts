import { Elysia } from 'elysia'

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function statusColor(status: number): string {
  if (status < 300) return colors.green
  if (status < 400) return colors.yellow
  return colors.red
}

function methodColor(method: string): string {
  switch (method) {
    case 'GET': return colors.cyan
    case 'POST': return colors.magenta
    case 'PUT': return colors.yellow
    case 'DELETE': return colors.red
    default: return colors.reset
  }
}

export function requestLogger(serviceName: string) {
  return (app: Elysia) =>
    app
      .onRequest(({ request, store }) => {
        ;(store as Record<string, unknown>).__startTime = performance.now()
      })
      .onAfterHandle(({ request, store, set }) => {
        const start = (store as Record<string, unknown>).__startTime as number
        const duration = (performance.now() - start).toFixed(1)
        const url = new URL(request.url)
        const method = request.method
        const status = set.status ?? 200
        const sc = statusColor(Number(status))
        const mc = methodColor(method)
        const r = colors.reset
        const d = colors.dim

        console.log(
          `${d}[${serviceName}]${r} ${mc}${method.padEnd(6)}${r} ${url.pathname}${url.search} ${sc}${status}${r} ${d}${duration}ms${r}`
        )
      })
}
