# TaskFlow Microservicios

App de tareas distribuida en microservicios: cada stack hace lo que mejor sabe, detrás de un API Gateway.

## Arquitectura

```txt
Frontend (React / Angular)
│
API Gateway (Nginx :8080)
├── /api/users/* → .NET 10 + SQL Server (auth, JWT)
├── /api/tasks/* → Express + Postgres (CRUD tareas)
└── /api/logs/*  → Flask + Mongo (auditoría)
```

## Servicios

| Servicio | Stack | Base de datos | Puerto interno |
| -------- | ----- | ------------- | -------------- |
| users | .NET 10 + EF Core + Minimal APIs | SQL Server | 5001 |
| tasks | Express + TypeScript + Prisma | PostgreSQL | 5002 |
| logs | Flask + PyMongo | MongoDB | 5003 |

> **Regla de oro:** la única entrada pública es el gateway (:8080).

## Levantar infraestructura

```bash
docker compose up -d
```

## Roadmap

- [ ] Fase 1: Infraestructura (3 BDs + Nginx)
- [ ] Fase 2: tasks (Express + Prisma)
- [ ] Fase 3: logs (Flask)
- [ ] Fase 4: users (.NET + JWT)
- [ ] Fase 5: Frontend React
- [ ] Fase 6: Frontend Angular