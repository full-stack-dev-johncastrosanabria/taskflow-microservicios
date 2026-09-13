import os
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from pymongo import MongoClient, DESCENDING
from bson import ObjectId

# La app. __name__ le dice a Flask dónde buscar recursos (templates, static).
# Gunicorn la importa desde fuera: por eso el Dockerfile hace `app:app`
# (archivo app.py, objeto app). Sin este objeto no hay nada que servir.
app = Flask(__name__)

# Configuración por entorno, nunca hardcodeada. En local la pone direnv
# desde .env; en Docker la inyecta el compose. Si falta, mejor reventar
# al arrancar con un mensaje claro que fallar a mitad de un request.
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set")

# El cliente se crea una sola vez a nivel de módulo: PyMongo maneja
# su propio pool de conexiones por debajo, así que compartirlo entre
# requests es lo correcto (crear uno por request agotaría conexiones).
# Ojo: MongoClient es perezoso, no conecta hasta la primera operación.
_client = MongoClient(MONGO_URI)

# La base sale del final de la URI (.../taskflow_logs). Si mañana la URI
# apunta a otra base, el código no cambia: por eso no va el nombre aquí.
_db = _client.get_default_database()
logs = _db["logs"]  # la "tabla" (colección). Se crea sola al primer insert.


@app.get("/health")
def health():
    # jsonify ya pone Content-Type: application/json. Devolver solo el dict
    # equivale a status 200.
    return jsonify(status="ok")


@app.post("/logs")
def create_log():
    # silent=True: si el body no es JSON válido devuelve None en vez de
    # lanzar un 400 automático de Flask. Preferimos validar nosotros.
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    if not isinstance(action, str) or not action.strip():
        # En Flask el return puede ser tupla (body, status). Sin el 400
        # respondería 200 con un mensaje de error: cuidado con dejar la
        # coma colgando sin el código.
        return jsonify(error="action is required"), 400
    metadata = data.get("metadata", {})
    if not isinstance(metadata, dict):
        return jsonify(error="metadata must be an object"), 400

    # El timestamp lo pone el servidor, nunca el cliente: si cada servicio
    # mandara el suyo, ordenar la auditoría sería imposible (relojes distintos).
    doc = {
        "action": action.strip(),
        "userId": data.get("userId"),
        "taskId": data.get("taskId"),
        "timestamp": datetime.now(timezone.utc),
        "metadata": metadata,
    }

    result = logs.insert_one(doc)
    # 201 = recurso creado. El _id de Mongo no es JSON-serializable,
    # así que se devuelve como string.
    return jsonify(id=str(result.inserted_id)), 201


@app.get("/logs")
def list_logs():
    # Auditoria sin tope = traer toda la historia en un request.
    # 50 por defecto, 200 como máximo negociable por query (?limit=).
    limit = min(int(request.args.get("limit", 50)), 200)
    docs = logs.find().sort("timestamp", DESCENDING).limit(limit)
    return jsonify([
        # Mongo devuelve _id (ObjectId) y datetime, ninguno serializa a JSON.
        # Se convierten a str e ISO aquí, en el borde del servicio.
        {**d, "_id": str(d["_id"]), "timestamp": d["timestamp"].isoformat()}
        for d in docs
    ])


@app.get("/logs/<id>")
def get_log(id):
    # <id> en la ruta llega como string y hay que declararlo como parámetro
    # de la función con el mismo nombre. Sin él, Flask responde 500 porque
    # intenta llamar a get_log() sin argumentos. Error clásico al copiar rutas.
    try:
        oid = ObjectId(id)
    except Exception:
        # Un id malformado no es "no encontrado" (404), es petición mala (400).
        return jsonify(error="invalid id"), 400
    d = logs.find_one({"_id": oid})
    if not d:
        return jsonify(error="log not found"), 404
    return jsonify({**d, "_id": str(d["_id"]), "timestamp": d["timestamp"].isoformat()})


if __name__ == "__main__":
    # Solo para `python app.py` o flask run en local. Gunicorn en Docker
    # importa `app` directamente y este bloque ni se ejecuta.
    # 0.0.0.0: dentro de un contenedor, oír solo en localhost dejaría
    # al gateway sin forma de llegar al servicio.
    app.run(host="0.0.0.0", port=5003)
# flask --app app run --host 0.0.0.0 --port 5003
# curl localhost:5003/health
# curl -X POST localhost:5003/logs -H 'Content-Type: application/json' -d '{"action":"task.created","userId":"u1","taskId":"abc","metadata":{"title":"Primera"}}'
# curl "localhost:5003/logs?limit=5"
# docker compose build logs