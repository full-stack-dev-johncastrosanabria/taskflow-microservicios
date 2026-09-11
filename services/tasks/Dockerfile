# tasks (Express + TS + Prisma) — CRUD, escucha en :5002.
# Multi-stage: compila TS en build, corre solo JS en runtime.

# Etapa build: instala todo (incl. devDeps) y genera dist/ + cliente Prisma.
FROM node:22-alpine AS build
WORKDIR /app
# Solo manifests primero → npm ci cacheado si no cambian deps.
COPY package*.json ./
RUN npm ci
COPY . ./
# Genera el cliente Prisma y compila TS a dist/.
RUN npx prisma generate && npm run build

# Etapa runtime: solo deps de producción + artefactos compilados.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=5002
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# Cliente Prisma generado + schema (necesario en runtime para migrate/query).
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
EXPOSE 5002
# Asume entry en dist/index.js.
CMD ["node", "dist/index.js"]
