// ============================================================
// Prisma Client — singleton
// NOTE: Run `npx prisma generate` after setting DATABASE_URL
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaInstance: any = null

// Lazy import to avoid build errors when @prisma/client not generated
async function getPrisma() {
  if (!prismaInstance) {
    const { PrismaClient } = await import('@prisma/client')
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }
  return prismaInstance
}

// Synchronous singleton for use in API routes
// Works after `npx prisma generate` has been run
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma: any }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let prisma: any

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client')
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
} catch {
  // Prisma not generated yet — create a proxy that throws helpful errors
  prisma = new Proxy({}, {
    get: (_target, prop) => {
      if (prop === '$transaction') {
        return async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)
      }
      return new Proxy(() => {}, {
        apply: () => {
          throw new Error(
            `Prisma client not generated. Run: npx prisma generate\n` +
            `Then add DATABASE_URL to your .env.local file.`
          )
        },
        get: (_t, method) => () => Promise.reject(
          new Error(`Prisma not ready. Run: npx prisma generate`)
        ),
      })
    },
  })
}

export { getPrisma }
