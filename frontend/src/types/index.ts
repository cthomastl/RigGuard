export type EquipmentStatus = "operational" | "warning" | "critical" | "offline" | "maintenance";
export type CriticalityLevel = "low" | "medium" | "high" | "critical";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "open" | "acknowledged" | "resolved";
export type WorkOrderStatus = "open" | "assigned" | "in_progress" | "on_hold" | "completed" | "cancelled";
export type WorkOrderPriority = "low" | "medium" | "high" | "emergency";
export type InspectionStatus = "scheduled" | "in_progress" | "completed" | "overdue" | "cancelled";
export type UserRole = "admin" | "engineer" | "technician" | "inspector";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  active: boolean;
}

export interface Equipment {
  id: number;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  location: string;
  facility: string;
  status: EquipmentStatus;
  installationDate: string;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  criticalityLevel: CriticalityLevel;
  notes: string;
  sensors?: Sensor[];
  alerts?: Alert[];
  inspections?: Inspection[];
  workOrders?: WorkOrder[];
  maintenanceSchedules?: MaintenanceSchedule[];
}

export interface Sensor {
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
  equipment?: Equipment;
}

export interface SensorReading {
  id: number;
  sensorId: number;
  value: number;
  recordedAt: string;
  anomaly: boolean;
  anomalyScore: number | null;
}

export interface Alert {
  id: number;
  equipmentId: number;
  sensorId: number | null;
  alertType: string;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  acknowledgedBy: number | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  equipment?: Equipment;
  sensor?: Sensor;
}

export interface Inspection {
  id: number;
  equipmentId: number;
  inspectorId: number | null;
  inspectionType: string;
  scheduledDate: string;
  completedDate: string | null;
  status: InspectionStatus;
  priority: WorkOrderPriority;
  checklist: string;
  findings: string;
  recommendations: string;
  nextInspectionDate: string | null;
  equipment?: Equipment;
  inspector?: User;
}

export interface WorkOrder {
  id: number;
  equipmentId: number;
  inspectionId: number | null;
  alertId: number | null;
  title: string;
  description: string;
  workType: "preventive" | "corrective" | "predictive" | "emergency";
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedTo: number | null;
  estimatedHours: number | null;
  actualHours: number | null;
  dueDate: string | null;
  completedAt: string | null;
  parts: string;
  notes: string;
  createdAt: string;
  equipment?: Equipment;
  assignee?: User;
}

export interface MaintenanceSchedule {
  id: number;
  equipmentId: number;
  maintenanceType: string;
  frequencyDays: number;
  lastPerformed: string | null;
  nextDue: string;
  description: string;
  active: boolean;
}

export interface DashboardStats {
  totalEquipment: number;
  operationalCount: number;
  warningCount: number;
  criticalCount: number;
  maintenanceCount: number;
  openAlerts: number;
  criticalAlerts: number;
  openWorkOrders: number;
  emergencyWorkOrders: number;
  overdueInspections: number;
  upcomingInspections: number;
  recentAnomalies: number;
  healthScore: number;
}

export interface PredictionResult {
  equipment_id: number;
  overall_risk: "low" | "medium" | "high" | "critical";
  overall_risk_score: number;
  predictions: SensorPrediction[];
  generated_at: string;
}

export interface SensorPrediction {
  sensor_id: number;
  sensor_name: string;
  sensor_type: string;
  unit: string;
  current_value: number;
  mean_24h: number;
  std_24h: number;
  trend_direction: "increasing" | "decreasing" | "stable";
  anomaly_score: number;
  rul_days: number | null;
  risk_score: number;
  max_threshold: number | null;
}
