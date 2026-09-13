# logs — Bitácora (Flask + Mongo)

## 1. Alcance (Fase 3)
- Servicio de auditoría: **solo escribe y lee eventos**, sin joins ni FK.
  DB `taskflow_logs` (la crea el primer insert; en Compass solo se ve al usarse).
- Escucha en `0.0.0.0:5003` (`MONGO_URI` por entorno).

## 2. Decisiones
- **PyMongo directo, sin ODM** (mongoengine/odmantic): el documento es flexible
  por diseño (`metadata` libre); el ODM agregaría rigidez sin pago.
- **Validación manual en código**: `action` requerido; `metadata` debe ser objeto.
- `timestamp` lo pone el **servidor** (`utcnow`), nunca el cliente.
- Dev: `flask run` · Prod: `gunicorn app:app` (ya en el Dockerfile).

## 3. Deps (`requirements.txt`)
- `flask`, `pymongo`, `gunicorn`
- **venv en la raíz del repo** (`.venv`), no en `services/logs/`: la extensión
  Python del editor (python-envs 1.36) no descubre venvs anidados y su selector
  nuevo crashea (`Cannot read properties... length`). Tradeoff consciente:
  se pierde "un entorno por servicio" a cambio de tooling funcional.
  Si un 2º servicio Python lo necesita, se reevalúa (uv workspaces o venvs con nombre).
- `.envrc` en `services/logs/`: `source ../../.venv/bin/activate` + `dotenv`
  (direnv; hook en `~/.zshrc`). Al entrar carga venv + `MONGO_URI`.

## 4. `app.py` — flujo Flask
- `app = Flask(__name__)` crea la app; ese objeto es lo que importa gunicorn
  (`app:app`). Los `@app.get/@app.post` registran ruta → función (vista).
- Cada request entra por la vista, que lee `request` (global de contexto),
  responde con `jsonify` y decide el status devolviendo tupla `(body, codigo)`.
- `MongoClient` una vez a nivel de módulo (pool interno compartido; además es
  perezoso: no conecta hasta la primera operación).
- Frontera JSON: hacia afuera `_id` → `str` y `datetime` → `isoformat`;
  hacia adentro `ObjectId(id)` valida (malformado → `400`, ausente → `404`).
- `if __name__ == "__main__"` solo corre en local; gunicorn lo ignora.

## 5. Bugs cazados en revisión (anotar el patrón)
- `get_log()` sin parámetro `id` con ruta `/logs/<id>` → Flask llama sin
  argumentos → **500**. Patrón: el nombre en `<...>` y en `def` deben coincidir.
- `return jsonify(...),` con coma colgando y sin status → tupla de 1 elemento,
  Flask responde **200** con cuerpo de error. Patrón: toda tupla de retorno
  lleva su código (`..., 400`).

## 6. Documento Log
- `action: str` (ej: `task.created`) · `userId?: str` · `taskId?: str`
- `timestamp: datetime` (servidor) · `metadata?: object`

## 6. Verificación
- `curl /health` → `POST` (`201`) → `GET` (`200`) → Compass muestra `taskflow_logs`
- `docker compose build logs` compila

## Pendiente
- Express → Flask: notify en crear/editar/borrar (Fase 3b)
- Gateway ya enruta `/api/logs/` (verificado en Fase 1)
