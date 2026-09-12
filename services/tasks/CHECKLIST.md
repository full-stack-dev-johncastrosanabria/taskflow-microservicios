# tasks — Checklist de setup

## 1. Scaffold
- `npm init`: name `tasks`, entry `dist/index.js`, `type: commonjs`
- `corepack enable` → todo con **pnpm** (no mezclar con npm)

## 2. Deps
- Prod: `pnpm add express @prisma/client @prisma/adapter-pg pg` (adapter obligatorio en Prisma 7)
- Dev: `pnpm add -D typescript @types/node @types/express @types/pg tsx prisma dotenv`
- Pin: `prisma@7.10.0` = `@prisma/client@7.10.0` (ignorar el nudge a la RC 8)

## 3. `pnpm-workspace.yaml`
- `allowBuilds: true` en `esbuild` (lo necesita `tsx`), `prisma`, `@prisma/engines`
- Luego `pnpm install`

## 4. `tsconfig.json` (TS 7)
- `target ES2022`, `module` + `moduleResolution`: `node16`
- `rootDir ./src`, `outDir ./dist`, `types: ["node"]`
- `strict` + `esModuleInterop` + `noUncheckedIndexedAccess`
- **Quitar**: `verbatimModuleSyntax` (prohíbe `import` en CJS → TS1295),
  `exactOptionalPropertyTypes`, `jsx`
- Notas TS7: `moduleResolution: node` ya no existe; `node16` exige pareja
  `module: node16`; a futuro, imports relativos con extensión `.js`

## 5. Scripts (`package.json`)
- `dev: tsx watch src/index.ts` · `build: tsc` · `start: node dist/index.js`

## 6. `src/index.ts`
- `import "dotenv/config"` **primero** (tsx no auto-carga `.env`; el fail-fast
  de `prisma.ts` lo exige antes de leer `process.env`)
- Express en `0.0.0.0:${PORT ?? 5002}` (el `0.0.0.0` lo exige Docker)
- `GET /health` → `{ status: "ok" }`
- `app.use(express.json())` **con paréntesis** (sin ellos se registra la fábrica
  como middleware: jamás llama `next()` y toda petición se cuelga) + `app.use("/tasks", tasksRouter)

## 7. Prisma 7 (config nueva, sin `url` en schema)
- `schema.prisma`: datasource solo con `provider`; modelo `Task` (`cuid()`,
  `userId` String plano = FK lógica, `@@map("tasks")`)
- `prisma.config.ts` en raíz del servicio: `defineConfig` + `env("DATABASE_URL")`,
  con `import "dotenv/config"` primero (el CLI no auto-carga el `.env`)
- `.env` en raíz del servicio (no en `prisma/`); comandos Prisma **desde**
  `services/tasks` (el `.env` se resuelve por cwd)
- `.env.example` sí se commitea, `.env` nunca
- `pnpm prisma migrate dev --name init` → `prisma/migrations/…_init/`

## 8. `src/prisma.ts` (singleton con adapter)
- Imports **nombrados**: `import { PrismaClient }`, `import { PrismaPg }`
  (los `import X from` por defecto fallan: TS2709/TS2351 en TS ≤6)
- Fail-fast si falta `DATABASE_URL`; singleton vía `globalThis` para `tsx watch`

## 9. CRUD (`src/routes/tasks.ts`)
- `GET /tasks` (lista, nuevas primero) · `POST /tasks` (`201`, `400` sin title/userId)
  · `GET /tasks/:id` · `PATCH /tasks/:id` · `DELETE /tasks/:id` (`204`)
- `Request<{ id: string }>` en rutas con `:id` (Express 5 tipa params como
  `string | string[] | undefined`; el path siempre es string simple)
- Body como `unknown` + type-guards (`t is string`); PATCH con spreads condicionales
- `update`/`delete` de id inexistente → `catch` → `404`

## 10. Verificación
- `npx tsc --noEmit` limpio (vale en TS 6 y 7)
- `pnpm dev` + `curl /health` → `POST` (`201`) → `GET`/`PATCH` (`200`) → `DELETE` (`204`) + casos `400`/`404`
- Migración aplicada, DB en sync

## Pendiente
- Migrar `Dockerfile` de `npm ci` a pnpm (`pnpm-lock.yaml` + copiar `prisma.config.ts`)
- Fase 3: logs (Flask) + notify Express → Flask
