# AGENTS.md

## Commands

- `npm run build` — nest build (output to `dist/`, wiped each build)
- `npm run start:dev` — dev server with watch (port 3000, overridable via `PORT` env)
- `npm run lint` — eslint with auto-fix (flat config at `eslint.config.mjs`)
- `npm run test` — unit tests (jest, config in `jest.config.js`)
- `npm run test:e2e` — e2e tests (jest, config at `test/jest-e2e.json`)
- `npm run format` — prettier on `src/` and `test/`
- `npm run test:cov` — coverage output to `coverage/`
- `npx tsc --noEmit` — typecheck (no npm script defined)
- `npx jest src/path/to/file.spec.ts` — run single unit test
- `npx jest --config ./test/jest-e2e.json test/app.e2e-spec.ts` — run single e2e test
- `npx prisma generate` — regenerate client after schema changes
- `npx prisma migrate dev` — dev migrations; `npx prisma migrate deploy` — prod

## Configuration

- **NestJS v11**, Express adapter, single app
- **TypeScript**: `module: "nodenext"`, target `ES2023`, `noImplicitAny: false`, `strictNullChecks: true`
- **All imports must use `.js` extensions** (required by `nodenext` module resolution)
- **ESLint**: flat config at `eslint.config.mjs`, `projectService: true` (type-aware). Key rules: `@typescript-eslint/no-explicit-any: off`, `no-floating-promises: warn`, `no-unsafe-argument: warn`, `prettier/prettier: error` (with `endOfLine: "auto"`)
- **Prettier**: single quotes, trailing commas (`trailingComma: "all"`)
- **Jest v30** (unit and e2e share same version)
- **Swagger docs** served at `/docs` (bearer auth configured)

## Build Gotchas

- `nest-cli.json` copies `src/modules/email/templates/**/*` as static assets to `dist/` on build — these templates don't exist yet
- `deleteOutDir: true` means `dist/` is wiped each build
- **Build order matters**: `npx prisma generate` must run before `npm run build` (Dockerfile does this)

## Package Manager

- **Production Docker** (`Dockerfile`): uses **npm** (`package-lock.json`, `npm ci`)
- **Dev Docker** (`Dockerfile.dev`): uses **bun** (`bun.lock`, `bun install`)
- **Local dev**: either works, but npm is the safer default since `package-lock.json` is the authoritative lockfile
- `yarn.lock` and `.eslintrc.js` are leftover files from the original NestJS template — ignore them

## Prisma Schema

PostgreSQL via Prisma v6 (`prisma/schema.prisma`). Schema defines:

**Enums**: `Gender`, `AdmissionStatus`, `DispenseType`, `DispenseOrderStatus`, `BedStatus`

**Models**: `Patient`, `Admission`, `RoomCategory`, `Room`, `DispenseOrder`, `DispenseOrderItem`

Multi-tenant pattern: most models have an `orgId` field with `@@index([orgId])`. Exceptions: `RoomCategory` has no `orgId` (global lookup), `DispenseOrderItem` has none (scoped via parent `DispenseOrder`). `Room.orgId` is nullable (allows shared rooms). All models use `@id @default(uuid()) @db.Uuid`.

## Module Status

Current modules in `src/modules/`:

**Implemented** (service + controller + DTOs):
- `patients` — CRUD for patients
- `admissions` — CRUD for admissions, linked to patients and rooms
- `rooms` — CRUD for rooms (linked to `RoomCategory`), plus separate `RoomCategoriesService` and `room-categories.controller` for room category lookup
- `dispense-orders` — CRUD for dispense orders, linked to patients/admissions/rooms

**Service-only**:
- `warehouse` — HTTP client proxying to a separate warehouse microservice (`WAREHOUSE_SERVICE_URL`). Uses `@nestjs/axios`. No controller — consumed by other modules. Fetches product/batch info via `GET /api/products` and `GET /api/products/:id`.

**Stub / Incomplete**:

| Module               | Issue                                                |
| -------------------- | ---------------------------------------------------- |
| `auth`               | Service exists but **all methods are commented out** |
| `users`              | Controller only, **no service file**                 |
| `organizations`      | Controller only, **no service file**                 |
| `roles`              | Controller only, **no service file**                 |
| `user-organizations` | Controller only, **no service file**                 |
| `email`              | **Empty module** (`@Module({})`)                     |

`health` module uses `@nestjs/terminus` — has controller + custom Prisma health indicator, no conventional service.

## Request Pipeline

1. Winston logger (replaces NestJS default)
2. Global prefix `/api`; Swagger at `/docs`
3. CORS enabled (all origins, no options)
4. Global `ValidationPipe` — **whitelist is commented out**, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion`
5. Global guards: ThrottlerGuard (10 req/60s) → JwtAuthGuard (respects `@Public()`) → RolesGuard
6. `AllExceptionsFilter` — normalizes errors to `{ statusCode, message, errors?, timestamp, path }`
7. `ResponseTransformInterceptor` — wraps success to `{ statusCode, message: "Success", data, timestamp, path }`

## Common Infrastructure (`src/common/`)

- **Decorators**: `@Public()`, `@CurrentUser()`, `@Roles()`, `@OrganizationId()`
- **Guards**: `JwtAuthGuard`, `RolesGuard` (reads required roles via Reflector, always returns `true` — stub)
- **Filters**: `AllExceptionsFilter`
- **Interceptors**: `ResponseTransformInterceptor`
- **DTOs**: `PaginationDto`, `PaginatedResponseDto` in `src/common/dto/`
- **Interfaces**: `AuthUser`, `JwtPayload`
- **PrismaModule** at `src/prisma/` — provides `PrismaService` globally

## Environment Variables

7 variables validated in `src/config/env.validation.ts`:

| Variable                | Required | Default                 |
| ----------------------- | -------- | ----------------------- |
| `NODE_ENV`              | No       | `development`           |
| `PORT`                  | No       | `3000`                  |
| `DATABASE_URL`          | Yes      | —                       |
| `JWT_ACCESS_SECRET`     | Yes      | —                       |
| `JWT_ACCESS_EXPIRATION` | No       | `15m`                   |
| `FRONTEND_URL`          | No       | `http://localhost:5173` |
| `WAREHOUSE_SERVICE_URL` | No       | `http://localhost:3001` |

`.env.example` is the current reference. `.example.env` is stale (uses different var names like `JWT_SECRET_KEY` instead of `JWT_ACCESS_SECRET`).

Additional vars referenced in code but **not yet validated**: `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

## Testing

- **Zero unit tests** — no `.spec.ts` files exist under `src/`
- Only e2e test: `test/app.e2e-spec.ts` (health endpoint)
- Jest config is in `jest.config.js` (root), **not** in `package.json` — the `jest` block in `package.json` is stale
- `jest.config.js` has `moduleNameMapper` for `src/` prefix alias, `setupFilesAfterEnv` pointing to `test/test-setup.ts`, and `testTimeout: 30000`
- `test/test-setup.ts` loads dotenv and sets env vars with **stale names** (e.g., `JWT_SECRET_KEY` instead of `JWT_ACCESS_SECRET`) — may need updating before tests pass
- E2E test enables `whitelist: true` on its own `ValidationPipe` (differs from `main.ts` where it's commented out), and does **not** apply `AllExceptionsFilter` or `ResponseTransformInterceptor`, so response shape differs from production

## Deployment

- **Docker**: `Dockerfile` (production, npm-based, multi-stage build). Health check hits `/api/health`
- **Vercel**: `vercel.json` configured to deploy `src/main.ts` via `@vercel/node`
- `docker-compose.yml` uses a pre-built image, expects external `internal_net` network
