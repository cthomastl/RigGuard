import { Router, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { Equipment, Alert, Inspection, WorkOrder, SensorReading, Sensor } from "../models";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/summary", async (_req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 86400000);
  const next30Days = new Date(now.getTime() + 30 * 86400000);

  const [
    totalEquipment, operationalCount, warningCount, criticalCount, maintenanceCount,
    openAlerts, criticalAlerts, openWorkOrders, emergencyWorkOrders,
    overdueInspections, upcomingInspections, recentAnomalies,
  ] = await Promise.all([
    Equipment.count(),
    Equipment.count({ where: { status: "operational" } }),
    Equipment.count({ where: { status: "warning" } }),
    Equipment.count({ where: { status: "critical" } }),
    Equipment.count({ where: { status: "maintenance" } }),
    Alert.count({ where: { status: "open" } }),
    Alert.count({ where: { status: "open", severity: "critical" } }),
    WorkOrder.count({ where: { status: ["open", "assigned", "in_progress"] } }),
    WorkOrder.count({ where: { status: ["open", "assigned", "in_progress"], priority: "emergency" } }),
    Inspection.count({ where: { status: "overdue" } }),
    Inspection.count({ where: { status: "scheduled", scheduledDate: { [Op.between]: [now, next30Days] } } }),
    SensorReading.count({ where: { anomaly: true, recordedAt: { [Op.gte]: last7Days } } }),
  ]);

  const healthScore = Math.round(
    (operationalCount / Math.max(totalEquipment, 1)) * 100 -
    criticalCount * 5 -
    warningCount * 2
  );

  const recentAlerts = await Alert.findAll({
    where: { createdAt: { [Op.gte]: last7Days } },
    include: [{ model: Equipment, as: "equipment", attributes: ["id", "name"] }],
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  const upcomingWorkOrders = await WorkOrder.findAll({
    where: { status: ["open", "assigned", "in_progress"], dueDate: { [Op.lte]: next30Days } },
    include: [{ model: Equipment, as: "equipment", attributes: ["id", "name", "facility"] }],
    order: [["dueDate", "ASC"]],
    limit: 5,
  });

  const criticalEquipment = await Equipment.findAll({
    where: { status: ["critical", "warning"] },
    include: [{ model: Alert, as: "alerts", where: { status: "open" }, required: false }],
    order: [["status", "ASC"]],
    limit: 5,
  });

  res.json({
    stats: {
      totalEquipment, operationalCount, warningCount, criticalCount, maintenanceCount,
      openAlerts, criticalAlerts, openWorkOrders, emergencyWorkOrders,
      overdueInspections, upcomingInspections, recentAnomalies,
      healthScore: Math.max(0, Math.min(100, healthScore)),
    },
    recentAlerts,
    upcomingWorkOrders,
    criticalEquipment,
  });
});

router.get("/equipment-health-trend", async (_req: AuthRequest, res: Response): Promise<void> => {
  // Return last 7 days anomaly count per day
  const days = 7;
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day.getTime() + 86400000);
    const anomalies = await SensorReading.count({ where: { anomaly: true, recordedAt: { [Op.between]: [day, nextDay] } } });
    const alerts = await Alert.count({ where: { createdAt: { [Op.between]: [day, nextDay] } } });
    result.push({ date: day.toISOString().slice(0, 10), anomalies, alerts });
  }
  res.json(result);
});

export default router;
