import { clsx, type ClassValue } from "clsx";
import { EquipmentStatus, AlertSeverity, WorkOrderPriority, InspectionStatus, CriticalityLevel } from "../types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function statusColor(status: EquipmentStatus): string {
  return {
    operational: "text-green-400 bg-green-400/10 border-green-400/30",
    warning: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    critical: "text-red-400 bg-red-400/10 border-red-400/30",
    offline: "text-gray-400 bg-gray-400/10 border-gray-400/30",
    maintenance: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  }[status] || "text-gray-400 bg-gray-400/10";
}

export function statusDot(status: EquipmentStatus): string {
  return { operational: "bg-green-400", warning: "bg-yellow-400", critical: "bg-red-400", offline: "bg-gray-400", maintenance: "bg-blue-400" }[status] || "bg-gray-400";
}

export function severityColor(severity: AlertSeverity): string {
  return { info: "text-blue-400 bg-blue-400/10 border-blue-400/30", warning: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", critical: "text-red-400 bg-red-400/10 border-red-400/30" }[severity];
}

export function priorityColor(priority: WorkOrderPriority): string {
  return { low: "text-gray-400 bg-gray-400/10", medium: "text-blue-400 bg-blue-400/10", high: "text-yellow-400 bg-yellow-400/10", emergency: "text-red-400 bg-red-400/10" }[priority];
}

export function inspectionStatusColor(status: InspectionStatus): string {
  return {
    scheduled: "text-blue-400 bg-blue-400/10",
    in_progress: "text-yellow-400 bg-yellow-400/10",
    completed: "text-green-400 bg-green-400/10",
    overdue: "text-red-400 bg-red-400/10",
    cancelled: "text-gray-400 bg-gray-400/10",
  }[status];
}

export function criticalityColor(level: CriticalityLevel): string {
  return { low: "text-gray-400", medium: "text-blue-400", high: "text-yellow-400", critical: "text-red-400" }[level];
}

export function riskColor(risk: string): string {
  return { low: "text-green-400", medium: "text-yellow-400", high: "text-orange-400", critical: "text-red-400" }[risk] || "text-gray-400";
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
