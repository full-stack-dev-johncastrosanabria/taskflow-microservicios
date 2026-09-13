// Puente tasks -> logs. Flask es auditoría, no crítico: si está caído,
// tasks no debe caerse. Por eso esto es es fire-and-forget con warn.

const LOGS_URL = (process.env.LOGS_URL ?? "http://localhost:5003").replace(/\/$/, "");
// En local es localhost:5003 (.env). Dentro de docker compose es 
// http://logs:5003 (nombre del servicio de taskflow-net). Misma var
// distinto valor según entorno.

type NotifyData = {
    userId?: string;
    taskId?: string;
    // Libre por diseño lo que se quiera auditar (título, tags, etc.)
    metadata?: Record<string, unknown>;
}

export async function notifyLog(action: string, data: NotifyData) : Promise<void> {
    // No validamos a muerte aquí: Flask ya valida `action` y responde 400.
    // Si la red falla o Flask está abajo, solo avisamos en consola.
    try {
        const res = await fetch(`${LOGS_URL}/logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, ...data }),
        });
        if (!res.ok) {
            // No lanzamos: un 400/500 de auditoría, no es error de negocio
            console.warn(`[logs] notify failed ${action} -> ${res.status}`);
        }
    } catch (err) {
        console.warn(`[logs] unreachable ${LOGS_URL}:`, (err as Error).message);
    }
}
