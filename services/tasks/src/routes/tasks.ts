import { Router, type Request, type Response } from "express";
import { prisma } from "../prisma.js"; // .js del import local — regla del node16
import { notifyLog } from "../logs.js";

export const tasksRouter = Router();

// Lista todo, lo nuevo primero
tasksRouter.get("/", async (_req: Request, res: Response) => {
    
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(tasks);

});

// Crea. 400 si falta title/userId, 201 si ok
tasksRouter.post("/", async (req: Request, res: Response) => {

    // req.body as {...unknown} : con strict, el body es any, el cast a unknown + type-guards es la forma honesta de validarlo.
    const { title, userId, tags, isComplete } = req.body as {
        title?: unknown;
        userId: unknown;
        tags?: unknown;
        isComplete?: unknown;
    };

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      res.status(400).json({ error: "title and userId are required" });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        userId: userId.trim(),
        tags: Array.isArray(tags)
          ? tags.filter((t): t is string => typeof t === "string") // es un type predicate: le dice a TS esto deja solo strings
          : [],
        isComplete: isComplete === true,
      },
    });
    
    // Auditoría: no bloquea la respuesta. Si Flask está caído, solo deja un warn.
    void notifyLog("task.created", {
      userId: task.userId,
      taskId: task.id,
      metadata: { title: task.title },
    });
    
    res.status(201).json(task);

});

// Detalle, 404 si no existe
tasksRouter.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) {
        res.status(404).json({ error: "task not found" });
        return;
    }
    res.json(task);
});

// Parcial. 404 si no existe 
tasksRouter.patch("/:id", async (req: Request<{id: string}>, res: Response) => {
  const { title, isComplete, tags } = req.body as {
    title?: unknown;
    isComplete?: unknown;
    tags?: unknown;
  };
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(typeof title === "string" ? { title } : {}),
        ...(typeof isComplete === "boolean" ? { isComplete } : {}),
        ...(Array.isArray(tags) ? { tags: tags.filter((t): t is string => typeof t === "string") } : {}),
      },
    });

    void notifyLog("task.updated", {
      userId: task.userId,
      taskId: task.id,
      metadata: { title, isComplete, tags },
    });

    res.json(task);

  } catch {

    res.status(404).json({ error: "task not found" });

  }
});

// Borra. 204 siempre (idempotente), 404 si nunca existió.
tasksRouter.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  // Guardamos el id antes de borrar para poder auditarlo.
  const taskId = req.params.id;
  try {
    const task = await prisma.task.delete({ where: { id: taskId } });
    void notifyLog("task.deleted", {
      userId: task.userId,
      taskId,
      metadata: { title: task.title },
    });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "task not found" });
  }
});
