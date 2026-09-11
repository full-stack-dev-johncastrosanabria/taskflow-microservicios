# tasks — Checklist de setup

## 1. Scaffold
- `npm init`: name `tasks`, entry `dist/index.js`, `type: commonjs`
- `corepack enable` → todo con **pnpm** (no mezclar con npm)

## 2. Deps
- Prod: `pnpm add express @prisma/client`
- Dev: `pnpm add -D typescript @types/node @types/express tsx prisma`
- Pin: `prisma@7.10.0` = `@prisma/client@7.10.0` (la RC 8 trae 400+ paquetes y rompe `generate`)

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
- Express en `0.0.0.0:${PORT ?? 5002}` (el `0.0.0.0` lo exige Docker)
- `GET /health` → `{ status: "ok" }`

## 7. Verificación
- `npx tsc --noEmit` limpio
- `pnpm dev` + `curl localhost:5002/health`

## Pendiente
- Migrar `Dockerfile` de `npm ci` a pnpm (`pnpm-lock.yaml`)
- `schema.prisma` + CRUD (Fase 2)
