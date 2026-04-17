# AGENTS.md

## Commands

- `npm run build` — nest build (output to `dist/`, cleared each build)
- `npm run start:dev` — dev server with watch (port 3000, overridable via `PORT` env)
- `npm run lint` — eslint with auto-fix (flat config at `eslint.config.mjs`)
- `npm run test` — unit tests (jest, `src/**/*.spec.ts`)
- `npm run test:e2e` — e2e tests (jest, `test/**/*.e2e-spec.ts`, config at `test/jest-e2e.json`)
- `npm run format` — prettier on `src/` and `test/`
- `npm run test:cov` — coverage output to `coverage/`
- `npx tsc --noEmit` — typecheck (no script defined)
- `npx jest src/path/to/file.spec.ts` — run single unit test
- `npx jest --config ./test/jest-e2e.json test/app.e2e-spec.ts` — run single e2e test
- `npx prisma generate` — regenerate client after schema changes
- `npx prisma migrate dev` — dev migrations; `npx prisma migrate deploy` — prod

## Configuration

- **NestJS v11**, Express adapter, single app
- **TypeScript**: `module: "nodenext"`, target `ES2023`, `noImplicitAny: false`, `strictNullChecks: true`
- **All imports use `.js` extensions** (required by `nodenext` module resolution)
- **ESLint**: flat config, `projectService: true` (type-aware). Key rules: `@typescript-eslint/no-explicit-any: off`, `no-floating-promises: warn`, `no-unsafe-argument: warn`, `prettier/prettier: error` (with `endOfLine: "auto"`)
- **Prettier**: single quotes, trailing commas (`trailingComma: "all"`)
- **Jest v30** (unit and e2e share same version)
- **Swagger docs** served at `/docs` (bearer auth configured)

## Build Gotchas

- `nest-cli.json` copies `src/modules/email/templates/**/*` as static assets to `dist/` on build — these templates don't exist yet
- `deleteOutDir: true` in nest-cli means `dist/` is wiped each build

## Prisma Schema

PostgreSQL via Prisma v6 (`prisma/schema.prisma`). **Schema has no models or enums defined yet** — only datasource and generator blocks exist. Many service modules (products, batches, purchase-orders, etc.) have Prisma queries written against models that don't yet exist in the schema, so they will fail at runtime until models are added.

## Stub / Incomplete Modules

These modules exist as files but are non-functional shells:

| Module               | Issue                                                |
| -------------------- | ---------------------------------------------------- |
| `auth`               | Service exists but **all methods are commented out** |
| `users`              | Controller exists, **no service file**               |
| `organizations`      | Controller exists, **no service file**               |
| `roles`              | Controller exists, **no service file**               |
| `user-organizations` | Controller exists, **no service file**               |
| `email`              | **Empty module** (`@Module({})`)                     |

**Fully implemented modules** (have service + DTOs + working Prisma queries): `health`, `unit-of-measures`, `product-categories`, `manufacturers`, `suppliers`, `warehouse-locations`, `products`, `batches`, `purchase-orders`, `inbound-shipments`, `outbound-shipments`, `transfers`, `stock-adjustments`, `formulas`, `compounding-batches`, `stock-movements`, `stock`.

## Request Pipeline

1. Winston logger (replaces NestJS default)
2. Global prefix `/api`; Swagger at `/docs`
3. CORS enabled (all origins)
4. Global `ValidationPipe` — whitelist, forbidNonWhitelisted, transform, enableImplicitConversion
5. Global guards: ThrottlerGuard (10 req/60s) → JwtAuthGuard (respects `@Public()`) → RolesGuard
6. `AllExceptionsFilter` — normalizes errors to `{ statusCode, message, errors?, timestamp, path }`
7. `ResponseTransformInterceptor` — wraps success to `{ statusCode, message: "Success", data, timestamp, path }`

## Common Infrastructure (`src/common/`)

- **Decorators**: `@Public()`, `@CurrentUser()`, `@Roles()`, `@OrganizationId()`
- **Guards**: `JwtAuthGuard`, `RolesGuard` (reads required roles via Reflector, always returns `true` — stub)
- **Filters**: `AllExceptionsFilter`
- **Interceptors**: `ResponseTransformInterceptor`
- **Interfaces**: `AuthUser`, `JwtPayload`
- **PrismaModule** at `src/prisma/` — provides `PrismaService` globally

## Environment Variables

Only 6 variables are actually validated in `src/config/env.validation.ts`:

| Variable                | Required | Default                 |
| ----------------------- | -------- | ----------------------- |
| `NODE_ENV`              | No       | `development`           |
| `PORT`                  | No       | `3000`                  |
| `DATABASE_URL`          | Yes      | —                       |
| `JWT_ACCESS_SECRET`     | Yes      | —                       |
| `JWT_ACCESS_EXPIRATION` | No       | `15m`                   |
| `FRONTEND_URL`          | No       | `http://localhost:5173` |

Additional vars referenced in code or dependencies but **not yet validated**: `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

## Testing

Zero `.spec.ts` unit tests. Only e2e test: `test/app.e2e-spec.ts` (health endpoint). E2E setup does **not** apply `AllExceptionsFilter` or `ResponseTransformInterceptor`, so response shape differs from production.
