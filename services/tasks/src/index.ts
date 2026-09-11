import express from "express"; // trae Express (el esModuleInterop del tsconfig es lo que permite este import sobre un paquete CommonJS).

const app = express(); // crea la app/servidor
const PORT = Number(process.env.PORT ?? 5002); // usa el PORT del compose cuando exista.

app.get("/health", (_req, res) => { // ruta salud
    res.json({ status: "ok" });
});

app.listen(PORT, "0.0.0.0", () => { // 0.0.0.0 obligatorio en Docker, (si oyes solo en localhost, el gateway no llega a ti)
    console.log(`tasks listening on :${PORT}`); 
});
