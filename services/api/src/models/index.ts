import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// ─── User ────────────────────────────────────────────────────────────────────
interface UserAttrs {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "admin" | "engineer" | "technician" | "inspector";
  department: string;
  active: boolean;
}
interface UserCreation extends Optional<UserAttrs, "id" | "active"> {}
export class User extends Model<UserAttrs, UserCreation> implements UserAttrs {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: "admin" | "engineer" | "technician" | "inspector";
  declare department: string;
  declare active: boolean;
}
User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.ENUM("admin", "engineer", "technician", "inspector"),
      defaultValue: "technician",
    },
    department: { type: DataTypes.STRING(100), defaultValue: "" },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: "users", underscored: true }
);

// ─── Equipment ───────────────────────────────────────────────────────────────
interface EquipmentAttrs {
  id: number;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  location: string;
  facility: string;
  status: "operational" | "warning" | "critical" | "offline" | "maintenance";
  installationDate: Date;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  criticalityLevel: "low" | "medium" | "high" | "critical";
  notes: string;
}
interface EquipmentCreation
  extends Optional<
    EquipmentAttrs,
    | "id"
    | "lastMaintenanceDate"
    | "nextMaintenanceDate"
    | "model"
    | "serialNumber"
    | "notes"
  > {}
export class Equipment
  extends Model<EquipmentAttrs, EquipmentCreation>
  implements EquipmentAttrs
{
  declare id: number;
  declare name: string;
  declare type: string;
  declare model: string;
  declare serialNumber: string;
  declare location: string;
  declare facility: string;
  declare status: "operational" | "warning" | "critical" | "offline" | "maintenance";
  declare installationDate: Date;
  declare lastMaintenanceDate: Date | null;
  declare nextMaintenanceDate: Date | null;
  declare criticalityLevel: "low" | "medium" | "high" | "critical";
  declare notes: string;
}
Equipment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    type: { type: DataTypes.STRING(100), allowNull: false },
    model: { type: DataTypes.STRING(100), defaultValue: "" },
    serialNumber: { type: DataTypes.STRING(100), defaultValue: "" },
    location: { type: DataTypes.STRING(200), allowNull: false },
    facility: { type: DataTypes.STRING(150), allowNull: false },
    status: {
      type: DataTypes.ENUM("operational", "warning", "critical", "offline", "maintenance"),
      defaultValue: "operational",
    },
    installationDate: { type: DataTypes.DATEONLY, allowNull: false },
    lastMaintenanceDate: { type: DataTypes.DATEONLY, allowNull: true },
    nextMaintenanceDate: { type: DataTypes.DATEONLY, allowNull: true },
    criticalityLevel: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      defaultValue: "medium",
    },
    notes: { type: DataTypes.TEXT, defaultValue: "" },
  },
  { sequelize, tableName: "equipment", underscored: true }
);

// ─── Sensor ──────────────────────────────────────────────────────────────────
interface SensorAttrs {
  id: number;
  equipmentId: number;
  name: string;
  sensorType: string;
  unit: string;
  minThreshold: number | null;
  maxThreshold: number | null;
  warningMinThreshold: number | null;
  warningMaxThreshold: number | null;
  active: boolean;
}
interface SensorCreation
  extends Optional<
    SensorAttrs,
    | "id"
    | "minThreshold"
    | "maxThreshold"
    | "warningMinThreshold"
    | "warningMaxThreshold"
    | "active"
  > {}
export class Sensor
  extends Model<SensorAttrs, SensorCreation>
  implements SensorAttrs
{
  declare id: number;
  declare equipmentId: number;
  declare name: string;
  declare sensorType: string;
  declare unit: string;
  declare minThreshold: number | null;
  declare maxThreshold: number | null;
  declare warningMinThreshold: number | null;
  declare warningMaxThreshold: number | null;
  declare active: boolean;
}
Sensor.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    equipmentId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    sensorType: { type: DataTypes.STRING(80), allowNull: false },
    unit: { type: DataTypes.STRING(30), allowNull: false },
    minThreshold: { type: DataTypes.FLOAT, allowNull: true },
    maxThreshold: { type: DataTypes.FLOAT, allowNull: true },
    warningMinThreshold: { type: DataTypes.FLOAT, allowNull: true },
    warningMaxThreshold: { type: DataTypes.FLOAT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: "sensors", underscored: true }
);

// ─── SensorReading ────────────────────────────────────────────────────────────
interface SensorReadingAttrs {
  id: number;
  sensorId: number;
  value: number;
  recordedAt: Date;
  anomaly: boolean;
  anomalyScore: number | null;
}
interface SensorReadingCreation
  extends Optional<SensorReadingAttrs, "id" | "anomaly" | "anomalyScore" | "recordedAt"> {}
export class SensorReading
  extends Model<SensorReadingAttrs, SensorReadingCreation>
  implements SensorReadingAttrs
{
  declare id: number;
  declare sensorId: number;
  declare value: number;
  declare recordedAt: Date;
  declare anomaly: boolean;
  declare anomalyScore: number | null;
}
SensorReading.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    sensorId: { type: DataTypes.INTEGER, allowNull: false },
    value: { type: DataTypes.FLOAT, allowNull: false },
    recordedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    anomaly: { type: DataTypes.BOOLEAN, defaultValue: false },
    anomalyScore: { type: DataTypes.FLOAT, allowNull: true },
  },
  { sequelize, tableName: "sensor_readings", underscored: true, timestamps: false }
);

// ─── Alert ────────────────────────────────────────────────────────────────────
interface AlertAttrs {
  id: number;
  equipmentId: number;
  sensorId: number | null;
  alertType: "threshold" | "anomaly" | "inspection_due" | "maintenance_due" | "manual";
  severity: "info" | "warning" | "critical";
  message: string;
  status: "open" | "acknowledged" | "resolved";
  acknowledgedBy: number | null;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
}
interface AlertCreation
  extends Optional<
    AlertAttrs,
    "id" | "sensorId" | "acknowledgedBy" | "acknowledgedAt" | "resolvedAt"
  > {}
export class Alert extends Model<AlertAttrs, AlertCreation> implements AlertAttrs {
  declare id: number;
  declare equipmentId: number;
  declare sensorId: number | null;
  declare alertType: "threshold" | "anomaly" | "inspection_due" | "maintenance_due" | "manual";
  declare severity: "info" | "warning" | "critical";
  declare message: string;
  declare status: "open" | "acknowledged" | "resolved";
  declare acknowledgedBy: number | null;
  declare acknowledgedAt: Date | null;
  declare resolvedAt: Date | null;
}
Alert.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    equipmentId: { type: DataTypes.INTEGER, allowNull: false },
    sensorId: { type: DataTypes.INTEGER, allowNull: true },
    alertType: {
      type: DataTypes.ENUM("threshold", "anomaly", "inspection_due", "maintenance_due", "manual"),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM("info", "warning", "critical"),
      defaultValue: "warning",
    },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM("open", "acknowledged", "resolved"),
      defaultValue: "open",
    },
    acknowledgedBy: { type: DataTypes.INTEGER, allowNull: true },
    acknowledgedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: "alerts", underscored: true }
);

// ─── Inspection ───────────────────────────────────────────────────────────────
interface InspectionAttrs {
  id: number;
  equipmentId: number;
  inspectorId: number | null;
  inspectionType: string;
  scheduledDate: Date;
  completedDate: Date | null;
  status: "scheduled" | "in_progress" | "completed" | "overdue" | "cancelled";
  priority: "low" | "medium" | "high" | "emergency";
  checklist: string;
  findings: string;
  recommendations: string;
  nextInspectionDate: Date | null;
  attachments: string;
}
interface InspectionCreation
  extends Optional<
    InspectionAttrs,
    | "id"
    | "inspectorId"
    | "completedDate"
    | "findings"
    | "recommendations"
    | "nextInspectionDate"
    | "attachments"
    | "checklist"
  > {}
export class Inspection
  extends Model<InspectionAttrs, InspectionCreation>
  implements InspectionAttrs
{
  declare id: number;
  declare equipmentId: number;
  declare inspectorId: number | null;
  declare inspectionType: string;
  declare scheduledDate: Date;
  declare completedDate: Date | null;
  declare status: "scheduled" | "in_progress" | "completed" | "overdue" | "cancelled";
  declare priority: "low" | "medium" | "high" | "emergency";
  declare checklist: string;
  declare findings: string;
  declare recommendations: string;
  declare nextInspectionDate: Date | null;
  declare attachments: string;
}
Inspection.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    equipmentId: { type: DataTypes.INTEGER, allowNull: false },
    inspectorId: { type: DataTypes.INTEGER, allowNull: true },
    inspectionType: { type: DataTypes.STRING(100), allowNull: false },
    scheduledDate: { type: DataTypes.DATEONLY, allowNull: false },
    completedDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM("scheduled", "in_progress", "completed", "overdue", "cancelled"),
      defaultValue: "scheduled",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "emergency"),
      defaultValue: "medium",
    },
    checklist: { type: DataTypes.TEXT, defaultValue: "[]" },
    findings: { type: DataTypes.TEXT, defaultValue: "" },
    recommendations: { type: DataTypes.TEXT, defaultValue: "" },
    nextInspectionDate: { type: DataTypes.DATEONLY, allowNull: true },
    attachments: { type: DataTypes.TEXT, defaultValue: "[]" },
  },
  { sequelize, tableName: "inspections", underscored: true }
);

// ─── WorkOrder ────────────────────────────────────────────────────────────────
interface WorkOrderAttrs {
  id: number;
  equipmentId: number;
  inspectionId: number | null;
  alertId: number | null;
  title: string;
  description: string;
  workType: "preventive" | "corrective" | "predictive" | "emergency";
  priority: "low" | "medium" | "high" | "emergency";
  status: "open" | "assigned" | "in_progress" | "on_hold" | "completed" | "cancelled";
  assignedTo: number | null;
  estimatedHours: number | null;
  actualHours: number | null;
  dueDate: Date | null;
  completedAt: Date | null;
  parts: string;
  notes: string;
}
interface WorkOrderCreation
  extends Optional<
    WorkOrderAttrs,
    | "id"
    | "inspectionId"
    | "alertId"
    | "assignedTo"
    | "estimatedHours"
    | "actualHours"
    | "dueDate"
    | "completedAt"
    | "parts"
    | "notes"
  > {}
export class WorkOrder
  extends Model<WorkOrderAttrs, WorkOrderCreation>
  implements WorkOrderAttrs
{
  declare id: number;
  declare equipmentId: number;
  declare inspectionId: number | null;
  declare alertId: number | null;
  declare title: string;
  declare description: string;
  declare workType: "preventive" | "corrective" | "predictive" | "emergency";
  declare priority: "low" | "medium" | "high" | "emergency";
  declare status: "open" | "assigned" | "in_progress" | "on_hold" | "completed" | "cancelled";
  declare assignedTo: number | null;
  declare estimatedHours: number | null;
  declare actualHours: number | null;
  declare dueDate: Date | null;
  declare completedAt: Date | null;
  declare parts: string;
  declare notes: string;
}
WorkOrder.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    equipmentId: { type: DataTypes.INTEGER, allowNull: false },
    inspectionId: { type: DataTypes.INTEGER, allowNull: true },
    alertId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    workType: {
      type: DataTypes.ENUM("preventive", "corrective", "predictive", "emergency"),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "emergency"),
      defaultValue: "medium",
    },
    status: {
      type: DataTypes.ENUM("open", "assigned", "in_progress", "on_hold", "completed", "cancelled"),
      defaultValue: "open",
    },
    assignedTo: { type: DataTypes.INTEGER, allowNull: true },
    estimatedHours: { type: DataTypes.FLOAT, allowNull: true },
    actualHours: { type: DataTypes.FLOAT, allowNull: true },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    parts: { type: DataTypes.TEXT, defaultValue: "[]" },
    notes: { type: DataTypes.TEXT, defaultValue: "" },
  },
  { sequelize, tableName: "work_orders", underscored: true }
);

// ─── MaintenanceSchedule ──────────────────────────────────────────────────────
interface MaintenanceScheduleAttrs {
  id: number;
  equipmentId: number;
  maintenanceType: string;
  frequencyDays: number;
  lastPerformed: Date | null;
  nextDue: Date;
  description: string;
  active: boolean;
}
interface MaintenanceScheduleCreation
  extends Optional<MaintenanceScheduleAttrs, "id" | "lastPerformed" | "active"> {}
export class MaintenanceSchedule
  extends Model<MaintenanceScheduleAttrs, MaintenanceScheduleCreation>
  implements MaintenanceScheduleAttrs
{
  declare id: number;
  declare equipmentId: number;
  declare maintenanceType: string;
  declare frequencyDays: number;
  declare lastPerformed: Date | null;
  declare nextDue: Date;
  declare description: string;
  declare active: boolean;
}
MaintenanceSchedule.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    equipmentId: { type: DataTypes.INTEGER, allowNull: false },
    maintenanceType: { type: DataTypes.STRING(120), allowNull: false },
    frequencyDays: { type: DataTypes.INTEGER, allowNull: false },
    lastPerformed: { type: DataTypes.DATEONLY, allowNull: true },
    nextDue: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: "" },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: "maintenance_schedules", underscored: true }
);

// ─── Associations ─────────────────────────────────────────────────────────────
Equipment.hasMany(Sensor, { foreignKey: "equipmentId", as: "sensors" });
Sensor.belongsTo(Equipment, { foreignKey: "equipmentId", as: "equipment" });

Sensor.hasMany(SensorReading, { foreignKey: "sensorId", as: "readings" });
SensorReading.belongsTo(Sensor, { foreignKey: "sensorId", as: "sensor" });

Equipment.hasMany(Alert, { foreignKey: "equipmentId", as: "alerts" });
Alert.belongsTo(Equipment, { foreignKey: "equipmentId", as: "equipment" });
Alert.belongsTo(Sensor, { foreignKey: "sensorId", as: "sensor" });

Equipment.hasMany(Inspection, { foreignKey: "equipmentId", as: "inspections" });
Inspection.belongsTo(Equipment, { foreignKey: "equipmentId", as: "equipment" });
Inspection.belongsTo(User, { foreignKey: "inspectorId", as: "inspector" });

Equipment.hasMany(WorkOrder, { foreignKey: "equipmentId", as: "workOrders" });
WorkOrder.belongsTo(Equipment, { foreignKey: "equipmentId", as: "equipment" });
WorkOrder.belongsTo(User, { foreignKey: "assignedTo", as: "assignee" });
WorkOrder.belongsTo(Inspection, { foreignKey: "inspectionId", as: "inspection" });
WorkOrder.belongsTo(Alert, { foreignKey: "alertId", as: "alert" });

Equipment.hasMany(MaintenanceSchedule, { foreignKey: "equipmentId", as: "maintenanceSchedules" });
MaintenanceSchedule.belongsTo(Equipment, { foreignKey: "equipmentId", as: "equipment" });

export default {
  User,
  Equipment,
  Sensor,
  SensorReading,
  Alert,
  Inspection,
  WorkOrder,
  MaintenanceSchedule,
};
