import "dotenv/config";
import express from "express"; // trae Express (el esModuleInterop del tsconfig es lo que permite este import sobre un paquete CommonJS).
import { tasksRouter } from "./routes/tasks.js";

const app = express(); // crea la app/servidor
const PORT = Number(process.env.PORT ?? 5002); // usa el PORT del compose cuando exista.

app.get("/health", (_req, res) => { // ruta salud
    res.json({ status: "ok" });
});

app.use(express.json()); // Sin express.json(), el req.body del POST llegaría undefined (validación daría 400 siempre)
app.use("/tasks", tasksRouter);

app.listen(PORT, "0.0.0.0", () => { // 0.0.0.0 obligatorio en Docker, (si oyes solo en localhost, el gateway no llega a ti)
    console.log(`tasks listening on :${PORT}`); 
});
