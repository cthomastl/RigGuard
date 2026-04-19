import { Router, Response } from "express";
import { Op } from "sequelize";
import { Equipment, Sensor, Alert, Inspection, WorkOrder, MaintenanceSchedule } from "../models";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, facility, type, search } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (facility) where.facility = facility;
  if (type) where.type = type;
  if (search) where.name = { [Op.like]: `%${search}%` };
  const equipment = await Equipment.findAll({
    where,
    include: [
      { model: Sensor, as: "sensors" },
      { model: Alert, as: "alerts", where: { status: "open" }, required: false },
    ],
    order: [["name", "ASC"]],
  });
  res.json(equipment);
});

router.get("/stats", async (_req: AuthRequest, res: Response): Promise<void> => {
  const total = await Equipment.count();
  const operational = await Equipment.count({ where: { status: "operational" } });
  const warning = await Equipment.count({ where: { status: "warning" } });
  const critical = await Equipment.count({ where: { status: "critical" } });
  const maintenance = await Equipment.count({ where: { status: "maintenance" } });
  const offline = await Equipment.count({ where: { status: "offline" } });
  const openAlerts = await Alert.count({ where: { status: "open" } });
  const criticalAlerts = await Alert.count({ where: { status: "open", severity: "critical" } });
  const openWorkOrders = await WorkOrder.count({ where: { status: ["open", "assigned", "in_progress"] } });
  const overdueInspections = await Inspection.count({ where: { status: "overdue" } });
  res.json({ total, operational, warning, critical, maintenance, offline, openAlerts, criticalAlerts, openWorkOrders, overdueInspections });
});

router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const eq = await Equipment.findByPk(req.params.id, {
    include: [
      { model: Sensor, as: "sensors" },
      { model: Alert, as: "alerts", limit: 10, order: [["createdAt", "DESC"]] },
      { model: Inspection, as: "inspections", limit: 5, order: [["scheduledDate", "DESC"]] },
      { model: WorkOrder, as: "workOrders", limit: 5, order: [["createdAt", "DESC"]] },
      { model: MaintenanceSchedule, as: "maintenanceSchedules" },
    ],
  });
  if (!eq) { res.status(404).json({ error: "Equipment not found" }); return; }
  res.json(eq);
});

router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const eq = await Equipment.create(req.body);
  res.status(201).json(eq);
});

router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const eq = await Equipment.findByPk(req.params.id);
  if (!eq) { res.status(404).json({ error: "Equipment not found" }); return; }
  await eq.update(req.body);
  res.json(eq);
});

router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const eq = await Equipment.findByPk(req.params.id);
  if (!eq) { res.status(404).json({ error: "Equipment not found" }); return; }
  await eq.destroy();
  res.status(204).send();
});

export default router;
