import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertTriangle, Bell, Filter } from "lucide-react";
import { alertsApi } from "../services/api";
import { Alert } from "../types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { severityColor, formatDateTime, timeAgo } from "../utils";

const SEVERITY_ICON = { info: "🔵", warning: "🟡", critical: "🔴" };
const ALERT_TYPE_LABELS: Record<string, string> = {
  threshold: "Threshold Exceeded", anomaly: "Anomaly Detected",
  inspection_due: "Inspection Due", maintenance_due: "Maintenance Due", manual: "Manual"
};

export function AlertsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("open");
  const [severityFilter, setSeverityFilter] = useState("");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts", statusFilter, severityFilter],
    queryFn: () => alertsApi.list({ ...(statusFilter ? { status: statusFilter } : {}), ...(severityFilter ? { severity: severityFilter } : {}) }).then(r => r.data),
    refetchInterval: 15000,
  });

  const acknowledge = useMutation({
    mutationFn: (id: number) => alertsApi.acknowledge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const resolve = useMutation({
    mutationFn: (id: number) => alertsApi.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const criticalCount = alerts.filter((a: Alert) => a.severity === "critical" && a.status === "open").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-gray-400 text-sm mt-0.5">{alerts.length} alerts · {criticalCount} critical</p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2 text-sm font-medium">
            <AlertTriangle size={16} /> {criticalCount} critical alert{criticalCount > 1 ? "s" : ""} require immediate action
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-500" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Alerts Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading && [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td></tr>
            ))}
            {!isLoading && alerts.map((alert: Alert) => (
              <tr key={alert.id} className={`hover:bg-gray-800/50 transition-colors ${alert.severity === "critical" && alert.status === "open" ? "bg-red-400/3" : ""}`}>
                <td className="px-4 py-3">
                  <Badge className={severityColor(alert.severity)}>
                    {SEVERITY_ICON[alert.severity]} {alert.severity.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}</td>
                <td className="px-4 py-3">
                  <div className="text-sm text-white">{alert.equipment?.name || "—"}</div>
                  <div className="text-xs text-gray-500">{alert.equipment?.facility}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{alert.message}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{timeAgo(alert.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge className={alert.status === "open" ? "text-red-400 bg-red-400/10 border-red-400/30" : alert.status === "acknowledged" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" : "text-green-400 bg-green-400/10 border-green-400/30"}>
                    {alert.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {alert.status === "open" && (
                      <Button size="sm" variant="secondary" onClick={() => acknowledge.mutate(alert.id)} disabled={acknowledge.isPending}>
                        <CheckCircle size={13} /> Ack
                      </Button>
                    )}
                    {alert.status !== "resolved" && (
                      <Button size="sm" variant="ghost" onClick={() => resolve.mutate(alert.id)} disabled={resolve.isPending}>
                        <XCircle size={13} /> Resolve
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && alerts.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                <Bell className="mx-auto mb-2 opacity-40" size={32} />
                No alerts match your filters
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
