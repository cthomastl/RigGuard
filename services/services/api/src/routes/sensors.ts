import { Router, Response } from "express";
import { Op } from "sequelize";
import { Sensor, SensorReading, Equipment, Alert } from "../models";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { equipmentId } = req.query;
  const where: any = {};
  if (equipmentId) where.equipmentId = equipmentId;
  const sensors = await Sensor.findAll({
    where,
    include: [{ model: Equipment, as: "equipment", attributes: ["id", "name", "facility"] }],
  });
  res.json(sensors);
});

router.get("/:id/readings", async (req: AuthRequest, res: Response): Promise<void> => {
  const { hours = "24", limit = "200" } = req.query;
  const since = new Date(Date.now() - parseInt(hours as string) * 3600000);
  const readings = await SensorReading.findAll({
    where: { sensorId: req.params.id, recordedAt: { [Op.gte]: since } },
    order: [["recordedAt", "ASC"]],
    limit: parseInt(limit as string),
  });
  res.json(readings);
});

router.post("/:id/readings", async (req: AuthRequest, res: Response): Promise<void> => {
  const sensor = await Sensor.findByPk(req.params.id);
  if (!sensor) { res.status(404).json({ error: "Sensor not found" }); return; }

  const { value } = req.body;
  let anomaly = false;
  let anomalyScore = 0;

  // Simple threshold-based anomaly detection
  if (sensor.maxThreshold !== null && value > sensor.maxThreshold) {
    anomaly = true; anomalyScore = Math.min(1, (value - sensor.maxThreshold) / (sensor.maxThreshold * 0.1));
    await Alert.create({ equipmentId: sensor.equipmentId, sensorId: sensor.id, alertType: "threshold", severity: value > sensor.maxThreshold * 1.1 ? "critical" : "warning", message: `${sensor.name} value ${value}${sensor.unit} exceeded ${sensor.maxThreshold}${sensor.unit} threshold`, status: "open" });
    if (anomaly) {
      const statuses: Record<string, "warning" | "critical"> = {};
      statuses[sensor.equipmentId] = value > (sensor.maxThreshold || 0) * 1.1 ? "critical" : "warning";
      await Equipment.update({ status: statuses[sensor.equipmentId] }, { where: { id: sensor.equipmentId } });
    }
  } else if (sensor.minThreshold !== null && value < sensor.minThreshold) {
    anomaly = true; anomalyScore = Math.min(1, (sensor.minThreshold - value) / (sensor.minThreshold * 0.1 || 1));
    await Alert.create({ equipmentId: sensor.equipmentId, sensorId: sensor.id, alertType: "threshold", severity: "warning", message: `${sensor.name} value ${value}${sensor.unit} below minimum ${sensor.minThreshold}${sensor.unit}`, status: "open" });
  }

  const reading = await SensorReading.create({ sensorId: sensor.id, value, anomaly, anomalyScore });
  res.status(201).json(reading);
});

router.get("/:id/latest", async (req: AuthRequest, res: Response): Promise<void> => {
  const reading = await SensorReading.findOne({
    where: { sensorId: req.params.id },
    order: [["recordedAt", "DESC"]],
  });
  res.json(reading);
});

export default router;
