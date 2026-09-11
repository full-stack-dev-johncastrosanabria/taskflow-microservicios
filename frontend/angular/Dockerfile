# Angular — servido por nginx en :80 interno, el gateway expone /angular/.
# Multi-stage: Node compila, nginx solo sirve el resultado.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./
# ng build apuntando al gateway (environment.prod con http://localhost:8080).
RUN npm run build

# Etapa serve: copia el estático (ajusta si tu outputPath difiere).
FROM nginx:alpine
# ng deja el html en dist/<proyecto>/browser; aplana o ajusta la ruta.
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
