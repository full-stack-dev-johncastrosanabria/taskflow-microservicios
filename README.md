# TaskFlow Microservicios

App de tareas distribuida en microservicios: cada stack hace lo que mejor sabe, detrás de un API Gateway.

## Arquitectura

```txt
Gateway (Nginx :8080)
├── /               → React (frontend-react:80)
├── /angular/       → Angular (frontend-angular:80)
├── /api/users/*    → .NET 10 + SQL Server (auth, JWT)
├── /api/tasks/*    → Express + Postgres (CRUD tareas)
└── /api/logs/*     → Flask + Mongo (auditoría)
```

## Servicios

| Servicio | Stack | Puerto interno |
| -------- | ----- | -------------- |
| users | .NET 10 + EF Core + Minimal APIs | 5001 |
| tasks | Express + TypeScript + Prisma | 5002 |
| logs | Flask + PyMongo + Gunicorn | 5003 |
| frontend-react | React (Vite) + Nginx | 80 |
| frontend-angular | Angular + Nginx | 80 |

> **Regla de oro:** la única entrada pública es el gateway (:8080).

## Dockerfiles

- `services/users/Dockerfile` (.NET 10, `Users.dll`)
- `services/tasks/Dockerfile` (Node 22, `dist/index.js`)
- `services/logs/Dockerfile` (Python 3.12, `app:app`)
- `frontend/react/Dockerfile` y `frontend/angular/Dockerfile` (build Node → Nginx)

## Uso

```bash
docker compose up -d --build
curl localhost:8080/healthz
```

## Roadmap

- [ ] Fase 1: Infraestructura (3 BDs + Nginx)
- [ ] Fase 2: tasks (Express + Prisma)
- [ ] Fase 3: logs (Flask)
- [ ] Fase 4: users (.NET + JWT)
- [ ] Fase 5: Frontend React
- [ ] Fase 6: Frontend Angular