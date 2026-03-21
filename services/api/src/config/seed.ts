import bcrypt from "bcryptjs";
import { connectDB } from "./database";
import {
  User, Equipment, Sensor, SensorReading, Alert, Inspection, WorkOrder, MaintenanceSchedule,
} from "../models";

async function seed() {
  await connectDB();

  // Users
  const hashed = await bcrypt.hash("Password123!", 10);
  const [admin] = await User.findOrCreate({
    where: { email: "admin@rigguard.com" },
    defaults: { name: "System Admin", email: "admin@rigguard.com", password: hashed, role: "admin", department: "Operations" },
  });
  const [eng] = await User.findOrCreate({
    where: { email: "engineer@rigguard.com" },
    defaults: { name: "Jane Petrov", email: "engineer@rigguard.com", password: hashed, role: "engineer", department: "Engineering" },
  });
  const [tech] = await User.findOrCreate({
    where: { email: "tech@rigguard.com" },
    defaults: { name: "Mike Torres", email: "tech@rigguard.com", password: hashed, role: "technician", department: "Field Ops" },
  });
  const [inspector] = await User.findOrCreate({
    where: { email: "inspector@rigguard.com" },
    defaults: { name: "Sarah Kim", email: "inspector@rigguard.com", password: hashed, role: "inspector", department: "HSE" },
  });

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  // Equipment
  const equipmentData = [
    { name: "Centrifugal Pump CP-101", type: "Pump", model: "Flowserve PVXM", serialNumber: "FLW-2019-4421", location: "Platform A - Deck 2", facility: "Offshore Platform Alpha", status: "operational" as const, installationDate: daysAgo(1200), criticalityLevel: "critical" as const },
    { name: "Gas Compressor GC-201", type: "Compressor", model: "Dresser-Rand 6DASF-4", serialNumber: "DR-2020-8831", location: "Platform A - Compressor Bay", facility: "Offshore Platform Alpha", status: "warning" as const, installationDate: daysAgo(900), criticalityLevel: "critical" as const },
    { name: "Pressure Vessel PV-301", type: "Pressure Vessel", model: "ASME Section VIII Div 1", serialNumber: "PV-2018-1122", location: "Platform B - Process Area", facility: "Offshore Platform Beta", status: "operational" as const, installationDate: daysAgo(1800), criticalityLevel: "high" as const },
    { name: "Pipeline Valve V-401", type: "Valve", model: "Cameron DB&B", serialNumber: "CAM-2021-5543", location: "Pipeline Km 12.4", facility: "Pipeline Network South", status: "operational" as const, installationDate: daysAgo(600), criticalityLevel: "high" as const },
    { name: "Gas Separator SEP-501", type: "Separator", model: "National Oilwell Varco", serialNumber: "NOV-2017-3310", location: "Platform B - Topsides", facility: "Offshore Platform Beta", status: "critical" as const, installationDate: daysAgo(2400), criticalityLevel: "critical" as const },
    { name: "Electric Submersible Pump ESP-601", type: "Pump", model: "Baker Hughes REDA", serialNumber: "BH-2022-9981", location: "Well A-14", facility: "Onshore Field Alpha", status: "maintenance" as const, installationDate: daysAgo(400), criticalityLevel: "medium" as const },
    { name: "Flare Stack FS-701", type: "Flare System", model: "John Zinc KS-II", serialNumber: "JZ-2016-2201", location: "Platform A - Bow", facility: "Offshore Platform Alpha", status: "operational" as const, installationDate: daysAgo(3000), criticalityLevel: "high" as const },
    { name: "Heat Exchanger HX-801", type: "Heat Exchanger", model: "Alfa Laval M15", serialNumber: "AL-2020-6670", location: "Platform B - Process Area", facility: "Offshore Platform Beta", status: "warning" as const, installationDate: daysAgo(700), criticalityLevel: "medium" as const },
  ];

  const createdEquipment: Equipment[] = [];
  for (const e of equipmentData) {
    const [eq] = await Equipment.findOrCreate({ where: { serialNumber: e.serialNumber }, defaults: { ...e, lastMaintenanceDate: daysAgo(30), nextMaintenanceDate: daysFromNow(60) } });
    createdEquipment.push(eq);
  }

  // Sensors
  const sensorDefs = [
    // CP-101
    { idx: 0, name: "Discharge Pressure", sensorType: "pressure", unit: "PSI", min: 0, max: 500, wMin: 50, wMax: 420 },
    { idx: 0, name: "Motor Temperature", sensorType: "temperature", unit: "°C", min: -10, max: 120, wMin: 10, wMax: 95 },
    { idx: 0, name: "Vibration X-Axis", sensorType: "vibration", unit: "mm/s", min: 0, max: 15, wMin: 0, wMax: 7.1 },
    { idx: 0, name: "Flow Rate", sensorType: "flow", unit: "m³/h", min: 0, max: 500, wMin: 50, wMax: 450 },
    // GC-201
    { idx: 1, name: "Suction Pressure", sensorType: "pressure", unit: "PSI", min: 0, max: 200, wMin: 20, wMax: 160 },
    { idx: 1, name: "Discharge Temp", sensorType: "temperature", unit: "°C", min: 20, max: 200, wMin: 30, wMax: 160 },
    { idx: 1, name: "Vibration", sensorType: "vibration", unit: "mm/s", min: 0, max: 18, wMin: 0, wMax: 11 },
    { idx: 1, name: "RPM", sensorType: "speed", unit: "RPM", min: 0, max: 3600, wMin: 1000, wMax: 3400 },
    // PV-301
    { idx: 2, name: "Vessel Pressure", sensorType: "pressure", unit: "PSI", min: 0, max: 1000, wMin: 100, wMax: 850 },
    { idx: 2, name: "Vessel Temperature", sensorType: "temperature", unit: "°C", min: 0, max: 150, wMin: 10, wMax: 120 },
    { idx: 2, name: "Level Sensor", sensorType: "level", unit: "%", min: 0, max: 100, wMin: 10, wMax: 90 },
    // SEP-501
    { idx: 4, name: "Gas Phase Pressure", sensorType: "pressure", unit: "PSI", min: 0, max: 800, wMin: 100, wMax: 680 },
    { idx: 4, name: "Liquid Level", sensorType: "level", unit: "%", min: 0, max: 100, wMin: 15, wMax: 85 },
    { idx: 4, name: "Inlet Temperature", sensorType: "temperature", unit: "°C", min: 10, max: 100, wMin: 15, wMax: 80 },
    // HX-801
    { idx: 7, name: "Hot Side Inlet Temp", sensorType: "temperature", unit: "°C", min: 30, max: 200, wMin: 40, wMax: 170 },
    { idx: 7, name: "Cold Side Outlet Temp", sensorType: "temperature", unit: "°C", min: 10, max: 100, wMin: 15, wMax: 85 },
  ];

  const createdSensors: Sensor[] = [];
  for (const s of sensorDefs) {
    const [sensor] = await Sensor.findOrCreate({
      where: { equipmentId: createdEquipment[s.idx].id, name: s.name },
      defaults: { equipmentId: createdEquipment[s.idx].id, name: s.name, sensorType: s.sensorType, unit: s.unit, minThreshold: s.min, maxThreshold: s.max, warningMinThreshold: s.wMin, warningMaxThreshold: s.wMax },
    });
    createdSensors.push(sensor);
  }

  // Sensor readings (last 24 hours, every 15 min)
  const existingCount = await SensorReading.count();
  if (existingCount === 0) {
    const readings: Partial<SensorReading>[] = [];
    const intervals = 96; // 24h / 15min
    const baselines: Record<number, number> = {};
    for (const s of createdSensors) baselines[s.id] = (s.minThreshold || 0) + ((s.maxThreshold || 100) - (s.minThreshold || 0)) * 0.55;

    for (let i = intervals; i >= 0; i--) {
      const ts = new Date(now.getTime() - i * 15 * 60000);
      for (const s of createdSensors) {
        const base = baselines[s.id];
        const range = ((s.maxThreshold || 100) - (s.minThreshold || 0)) * 0.08;
        const value = parseFloat((base + (Math.random() - 0.5) * range * 2).toFixed(2));
        readings.push({ sensorId: s.id, value, recordedAt: ts, anomaly: false, anomalyScore: 0 });
      }
    }
    // Inject some anomalies for SEP-501
    const sep501Sensors = createdSensors.filter(s => s.equipmentId === createdEquipment[4].id);
    if (sep501Sensors.length > 0) {
      const last10 = readings.filter(r => r.sensorId === sep501Sensors[0].id).slice(-10);
      for (const r of last10) { r.value = (sep501Sensors[0].maxThreshold || 800) * 0.95; r.anomaly = true; r.anomalyScore = 0.85; }
    }
    await SensorReading.bulkCreate(readings as any[]);
  }

  // Alerts
  await Alert.findOrCreate({
    where: { equipmentId: createdEquipment[1].id, message: "Vibration exceeds warning threshold on GC-201" },
    defaults: { equipmentId: createdEquipment[1].id, sensorId: createdSensors[6].id, alertType: "threshold", severity: "warning", message: "Vibration exceeds warning threshold on GC-201", status: "open" },
  });
  await Alert.findOrCreate({
    where: { equipmentId: createdEquipment[4].id, message: "Gas Phase Pressure approaching critical limit on SEP-501" },
    defaults: { equipmentId: createdEquipment[4].id, sensorId: createdSensors[11].id, alertType: "anomaly", severity: "critical", message: "Gas Phase Pressure approaching critical limit on SEP-501", status: "open" },
  });
  await Alert.findOrCreate({
    where: { equipmentId: createdEquipment[7].id, message: "Inspection overdue for HX-801" },
    defaults: { equipmentId: createdEquipment[7].id, sensorId: null, alertType: "inspection_due", severity: "warning", message: "Inspection overdue for HX-801", status: "acknowledged", acknowledgedBy: eng.id, acknowledgedAt: daysAgo(1) },
  });

  // Inspections
  await Inspection.findOrCreate({
    where: { equipmentId: createdEquipment[0].id, inspectionType: "Routine Mechanical" },
    defaults: { equipmentId: createdEquipment[0].id, inspectorId: inspector.id, inspectionType: "Routine Mechanical", scheduledDate: daysFromNow(5), status: "scheduled", priority: "medium", checklist: JSON.stringify(["Check bearing temps","Inspect seals","Verify alignment","Test pressure relief","Lubrication check"]) },
  });
  await Inspection.findOrCreate({
    where: { equipmentId: createdEquipment[1].id, inspectionType: "Vibration Analysis" },
    defaults: { equipmentId: createdEquipment[1].id, inspectorId: inspector.id, inspectionType: "Vibration Analysis", scheduledDate: daysAgo(1), status: "in_progress", priority: "high", checklist: JSON.stringify(["Baseline vibration reading","Frequency spectrum analysis","Bearing condition","Coupling alignment","Foundation bolts"]), findings: "Elevated vibration at 2x running speed - possible imbalance" },
  });
  await Inspection.findOrCreate({
    where: { equipmentId: createdEquipment[4].id, inspectionType: "Emergency Safety Inspection" },
    defaults: { equipmentId: createdEquipment[4].id, inspectorId: inspector.id, inspectionType: "Emergency Safety Inspection", scheduledDate: daysAgo(0), status: "scheduled", priority: "emergency", checklist: JSON.stringify(["Pressure relief valve test","Vessel integrity check","Instrumentation calibration","Emergency shutdown test","Corrosion inspection"]) },
  });
  await Inspection.findOrCreate({
    where: { equipmentId: createdEquipment[7].id, inspectionType: "Fouling & Efficiency Check" },
    defaults: { equipmentId: createdEquipment[7].id, inspectorId: null, inspectionType: "Fouling & Efficiency Check", scheduledDate: daysAgo(10), status: "overdue", priority: "medium", checklist: JSON.stringify(["Thermal efficiency test","Tube bundle inspection","Pressure drop measurement","Cleaning assessment"]) },
  });

  // Work Orders
  await WorkOrder.findOrCreate({
    where: { equipmentId: createdEquipment[1].id, title: "Rotor Balancing - GC-201" },
    defaults: { equipmentId: createdEquipment[1].id, title: "Rotor Balancing - GC-201", description: "Balance compressor rotor due to elevated vibration readings. Requires shutdown and specialist equipment.", workType: "corrective", priority: "high", status: "assigned", assignedTo: tech.id, estimatedHours: 8, dueDate: daysFromNow(3), parts: JSON.stringify(["Balancing weights","Coupling insert","Bearing grease"]) },
  });
  await WorkOrder.findOrCreate({
    where: { equipmentId: createdEquipment[5].id, title: "Quarterly Preventive Maintenance - ESP-601" },
    defaults: { equipmentId: createdEquipment[5].id, title: "Quarterly Preventive Maintenance - ESP-601", description: "Scheduled preventive maintenance including pump pull and inspection.", workType: "preventive", priority: "medium", status: "in_progress", assignedTo: tech.id, estimatedHours: 16, dueDate: daysFromNow(7) },
  });
  await WorkOrder.findOrCreate({
    where: { equipmentId: createdEquipment[4].id, title: "Emergency Pressure Relief - SEP-501" },
    defaults: { equipmentId: createdEquipment[4].id, title: "Emergency Pressure Relief - SEP-501", description: "Investigate and resolve critical pressure anomaly. Safety-critical.", workType: "emergency", priority: "emergency", status: "open", estimatedHours: 4, dueDate: daysFromNow(0) },
  });

  // Maintenance Schedules
  for (const eq of createdEquipment) {
    await MaintenanceSchedule.findOrCreate({
      where: { equipmentId: eq.id, maintenanceType: "Lubrication Service" },
      defaults: { equipmentId: eq.id, maintenanceType: "Lubrication Service", frequencyDays: 30, lastPerformed: daysAgo(20), nextDue: daysFromNow(10), description: "Grease bearings and lubrication points per OEM specs" },
    });
    await MaintenanceSchedule.findOrCreate({
      where: { equipmentId: eq.id, maintenanceType: "Annual Overhaul" },
      defaults: { equipmentId: eq.id, maintenanceType: "Annual Overhaul", frequencyDays: 365, lastPerformed: daysAgo(300), nextDue: daysFromNow(65), description: "Full OEM overhaul including internals inspection" },
    });
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
