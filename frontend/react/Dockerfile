# React (Vite) — servido por nginx en :80 interno, el gateway expone /.
# Multi-stage: Node compila el estático, nginx solo lo sirve.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./
# Genera dist/ apuntando al gateway (ej: VITE_API_URL=http://localhost:8080).
RUN npm run build

# Etapa serve: sin Node, solo html/css/js estáticos.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
