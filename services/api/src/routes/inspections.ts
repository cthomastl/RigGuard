import { Router, Response } from "express";
import { Equipment, Inspection, User } from "../models";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, priority, equipmentId } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (equipmentId) where.equipmentId = equipmentId;
  const inspections = await Inspection.findAll({
    where,
    include: [
      { model: Equipment, as: "equipment", attributes: ["id", "name", "facility", "location", "type"] },
      { model: User, as: "inspector", attributes: ["id", "name", "email"] },
    ],
    order: [["scheduledDate", "ASC"]],
  });
  res.json(inspections);
});

router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const inspection = await Inspection.findByPk(req.params.id, {
    include: [
      { model: Equipment, as: "equipment" },
      { model: User, as: "inspector", attributes: ["id", "name", "email"] },
    ],
  });
  if (!inspection) { res.status(404).json({ error: "Inspection not found" }); return; }
  res.json(inspection);
});

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const inspection = await Inspection.create(req.body);
  res.status(201).json(inspection);
});

router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const inspection = await Inspection.findByPk(req.params.id);
  if (!inspection) { res.status(404).json({ error: "Inspection not found" }); return; }
  await inspection.update(req.body);
  // If completed, update equipment last maintenance
  if (req.body.status === "completed") {
    await Equipment.update({ lastMaintenanceDate: new Date() }, { where: { id: inspection.equipmentId } });
  }
  res.json(inspection);
});

router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const inspection = await Inspection.findByPk(req.params.id);
  if (!inspection) { res.status(404).json({ error: "Inspection not found" }); return; }
  await inspection.update({ status: "cancelled" });
  res.json({ message: "Inspection cancelled" });
});

export default router;
