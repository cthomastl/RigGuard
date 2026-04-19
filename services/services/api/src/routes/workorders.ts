import { Router, Response } from "express";
import { Equipment, WorkOrder, User, Inspection, Alert } from "../models";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, priority, workType, assignedTo, equipmentId } = req.query;
  const where: any = {};
  if (status) where.status = (status as string).includes(",") ? (status as string).split(",") : status;
  if (priority) where.priority = priority;
  if (workType) where.workType = workType;
  if (assignedTo) where.assignedTo = assignedTo;
  if (equipmentId) where.equipmentId = equipmentId;
  const orders = await WorkOrder.findAll({
    where,
    include: [
      { model: Equipment, as: "equipment", attributes: ["id", "name", "facility", "location", "type"] },
      { model: User, as: "assignee", attributes: ["id", "name", "email"] },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.json(orders);
});

router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const wo = await WorkOrder.findByPk(req.params.id, {
    include: [
      { model: Equipment, as: "equipment" },
      { model: User, as: "assignee", attributes: ["id", "name", "email"] },
      { model: Inspection, as: "inspection" },
      { model: Alert, as: "alert" },
    ],
  });
  if (!wo) { res.status(404).json({ error: "Work order not found" }); return; }
  res.json(wo);
});

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const wo = await WorkOrder.create(req.body);
  res.status(201).json(wo);
});

router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const wo = await WorkOrder.findByPk(req.params.id);
  if (!wo) { res.status(404).json({ error: "Work order not found" }); return; }
  if (req.body.status === "completed" && !req.body.completedAt) req.body.completedAt = new Date();
  await wo.update(req.body);
  // Mark equipment operational if work order completed
  if (req.body.status === "completed") {
    await Equipment.update({ status: "operational", lastMaintenanceDate: new Date() }, { where: { id: wo.equipmentId } });
  }
  res.json(wo);
});

export default router;
