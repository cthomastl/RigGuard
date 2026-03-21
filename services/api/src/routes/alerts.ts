import { Router, Response } from "express";
import { Equipment, Alert, Sensor, User } from "../models";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, severity, equipmentId } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (equipmentId) where.equipmentId = equipmentId;
  const alerts = await Alert.findAll({
    where,
    include: [
      { model: Equipment, as: "equipment", attributes: ["id", "name", "facility", "location"] },
      { model: Sensor, as: "sensor", attributes: ["id", "name", "unit"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: 200,
  });
  res.json(alerts);
});

router.post("/:id/acknowledge", async (req: AuthRequest, res: Response): Promise<void> => {
  const alert = await Alert.findByPk(req.params.id);
  if (!alert) { res.status(404).json({ error: "Alert not found" }); return; }
  await alert.update({ status: "acknowledged", acknowledgedBy: req.user!.id, acknowledgedAt: new Date() });
  res.json(alert);
});

router.post("/:id/resolve", async (req: AuthRequest, res: Response): Promise<void> => {
  const alert = await Alert.findByPk(req.params.id);
  if (!alert) { res.status(404).json({ error: "Alert not found" }); return; }
  await alert.update({ status: "resolved", resolvedAt: new Date() });
  res.json(alert);
});

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const alert = await Alert.create(req.body);
  res.status(201).json(alert);
});

export default router;
