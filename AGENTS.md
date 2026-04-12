# AGENTS.md

## Critical Issue

**Codebase is incomplete and cannot build/run.** `app.module.ts` imports modules that don't exist:

- `AuthModule` (expected at `src/modules/auth/`)
- `UsersModule` (expected at `src/modules/users/`)
- `OrganizationsModule` (expected at `src/modules/organizations/`)
- `RolesModule` (expected at `src/modules/roles/`)
- `UserOrganizationsModule` (expected at `src/modules/user-organizations/`)
- `EmailModule` (expected at `src/modules/email/`)

Only module implemented: `HealthModule` at `src/modules/health/`.

## Commands

- `npm run build` — nest build (output to `dist/`, cleared each build)
- `npm run start:dev` — dev server with watch (port 3000, overridable via `PORT` env)
- `npm run lint` — eslint with auto-fix (flat config at `eslint.config.mjs`)
- `npm run test` — unit tests (jest, `src/**/*.spec.ts`)
- `npm run test:e2e` — e2e tests (jest, `test/**/*.e2e-spec.ts`, config at `test/jest-e2e.json`)
- `npm run format` — prettier on `src/` and `test/`
- `npm run test:cov` — coverage output to `coverage/`

No typecheck script defined; use `npx tsc --noEmit` to typecheck.

## Configuration

- **NestJS v11**, Express adapter, single app (no monorepo)
- **TypeScript**: `module: "nodenext"`, target `ES2023`, `noImplicitAny: false`, `strictNullChecks: true`
- **All imports use `.js` extensions** (required by `nodenext` module resolution)
- **ESLint**: flat config at `eslint.config.mjs`, uses `projectService: true` (type-aware linting)
  - Rules: `@typescript-eslint/no-explicit-any: off`, `@typescript-eslint/no-floating-promises: warn`, `@typescript-eslint/no-unsafe-argument: warn`
- **Prettier**: single quotes, trailing commas
- **Jest v30** (both unit and e2e)

## Environment Variables

Required by `src/config/env.validation.ts` but not all documented in `.env.example`:

| Variable                 | Required | Default                                          | Description                       |
| ------------------------ | -------- | ------------------------------------------------ | --------------------------------- |
| `NODE_ENV`               | No       | `development`                                    | development \| production \| test |
| `PORT`                   | No       | `3000`                                           | Server port                       |
| `DATABASE_URL`           | Yes      | —                                                | PostgreSQL connection string      |
| `JWT_ACCESS_SECRET`      | Yes      | —                                                | Signs access tokens               |
| `JWT_REFRESH_SECRET`     | Yes      | —                                                | Signs refresh tokens              |
| `JWT_ACCESS_EXPIRATION`  | No       | `15m`                                            | Access token expiry               |
| `JWT_REFRESH_EXPIRATION` | No       | `7d`                                             | Refresh token expiry              |
| `GOOGLE_CLIENT_ID`       | Yes      | —                                                | Google OAuth client ID            |
| `GOOGLE_CLIENT_SECRET`   | Yes      | —                                                | Google OAuth client secret        |
| `GOOGLE_CALLBACK_URL`    | No       | `http://localhost:3000/api/auth/google/callback` | Google OAuth callback URL         |
| `SMTP_HOST`              | No       | `localhost`                                      | SMTP server host                  |
| `SMTP_PORT`              | No       | `587`                                            | SMTP server port                  |
| `SMTP_USER`              | No       | ``                                               | SMTP username                     |
| `SMTP_PASS`              | No       | ``                                               | SMTP password                     |
| `SMTP_FROM`              | No       | `noreply@example.com`                            | SMTP from address                 |
| `FRONTEND_URL`           | No       | `http://localhost:5173`                          | Frontend URL                      |

## Request Processing Pipeline (when modules exist)

1. Winston logger (replaces NestJS default)
2. Global prefix `/api`
3. CORS enabled (all origins — default settings)
4. Global `ValidationPipe` — whitelist, forbidNonWhitelisted, transform, enableImplicitConversion
5. Global guards: ThrottlerGuard (10 req/60s) → JwtAuthGuard (respects `@Public()`) → RolesGuard
6. `AllExceptionsFilter` — normalizes all errors to `{ statusCode, message, errors?, timestamp, path }`
7. `ResponseTransformInterceptor` — wraps success to `{ statusCode, message: "Success", data, timestamp, path }`

## Current Working Code

Only implemented feature: `GET /api/health` — database health check via Terminus

E2E test exists at `test/app.e2e-spec.ts` but doesn't apply `AllExceptionsFilter` or `ResponseTransformInterceptor`, so response shape differs from production.

## Common Infrastructure (defined but unused)

- **Decorators**: `@Public()`, `@CurrentUser()`, `@Roles()`
- **Guards**: `JwtAuthGuard`, `RolesGuard` (queries `userOrganization` table)
- **Filters**: `AllExceptionsFilter`
- **Interceptors**: `ResponseTransformInterceptor`
- **Interfaces**: `AuthUser`, `JwtPayload`

These are globally configured but won't work without implementing the missing modules.

## Prisma

Prisma v6 configured for PostgreSQL (`prisma/schema.prisma`), but schema only contains datasource and generator (no models defined).

Run `npx prisma generate` after schema changes, `npx prisma migrate dev` for dev migrations, `npx prisma migrate deploy` for prod.

## Testing

Zero `.spec.ts` unit tests. Only e2e test: `test/app.e2e-spec.ts` (health endpoint).

Run single test file: `npx jest src/path/to/file.spec.ts`
Run single e2e test: `npx jest --config ./test/jest-e2e.json test/app.e2e-spec.ts`
