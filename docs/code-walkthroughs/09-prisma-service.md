# 09 - Prisma Service

Source: `apps/api/src/modules/prisma/services/prisma.service.ts`

## Why This File Matters

This file adapts Prisma into Nest's dependency injection lifecycle. Instead of every service creating its own database client, the app shares one injectable `PrismaService`.

## Line-By-Line Reading Notes

Line 1 imports Nest lifecycle interfaces.

Line 2 imports `PrismaClient`.

Line 4 marks the class as `@Injectable()`, which means Nest can provide it to constructors.

Line 5 extends `PrismaClient`. This means `PrismaService` has methods like `user.findMany`, `hireRequest.create`, and `$transaction`.

Lines 6-8 implement `onModuleInit()`. When Nest starts this module, it connects to the database.

Lines 10-12 implement `onModuleDestroy()`. When Nest shuts down the module, it disconnects from the database.

## Codebase Connections

- `HiringService`, `WorkersService`, `DocumentsService`, `PayrollService`, `InvoicesService`, and others inject this service.
- `PrismaModule` provides and exports this class.
- The generated Prisma Client comes from `packages/database/prisma/schema.prisma`.

## Senior-Level Questions

- Should query logging be enabled here?
- Should Prisma middleware/extensions be registered here for tenant filtering or audit helpers?
- Should the app handle graceful shutdown hooks explicitly?
