import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, Wrench, ClipboardList, TrendingUp,
  CheckCircle, XCircle, Clock, Zap, BarChart3
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts";
import { dashboardApi } from "../services/api";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { severityColor, statusColor, statusDot, timeAgo, formatDate } from "../utils";
import { Alert, WorkOrder } from "../types";

const STATUS_PIE_COLORS = ["#22c55e", "#eab308", "#ef4444", "#3b82f6", "#6b7280"];

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardApi.summary().then(r => r.data),
    refetchInterval: 30000,
  });
  const { data: trend } = useQuery({
    queryKey: ["health-trend"],
    queryFn: () => dashboardApi.healthTrend().then(r => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );

  const { stats, recentAlerts, upcomingWorkOrders, criticalEquipment } = summary || {};
  const pieData = [
    { name: "Operational", value: stats?.operationalCount || 0 },
    { name: "Warning", value: stats?.warningCount || 0 },
    { name: "Critical", value: stats?.criticalCount || 0 },
    { name: "Maintenance", value: stats?.maintenanceCount || 0 },
    { name: "Offline", value: 0 },
  ].filter(d => d.value > 0);

  const healthColor = (stats?.healthScore || 0) >= 80 ? "green" : (stats?.healthScore || 0) >= 60 ? "yellow" : "red";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Real-time equipment health & maintenance overview</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Last updated</p>
          <p className="text-sm text-gray-300">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Health Score Banner */}
      {stats && (
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${healthColor === "green" ? "bg-green-400/5 border-green-400/20" : healthColor === "yellow" ? "bg-yellow-400/5 border-yellow-400/20" : "bg-red-400/5 border-red-400/20"}`}>
          <div className={`text-5xl font-bold ${healthColor === "green" ? "text-green-400" : healthColor === "yellow" ? "text-yellow-400" : "text-red-400"}`}>
            {stats.healthScore}
          </div>
          <div>
            <p className="text-white font-semibold">Fleet Health Score</p>
            <p className="text-gray-400 text-sm">
              {stats.healthScore >= 80 ? "Fleet operating normally. Continue regular maintenance." :
               stats.healthScore >= 60 ? "Several units require attention. Review warnings." :
               "CRITICAL: Multiple equipment failures detected. Immediate action required."}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Equipment" value={stats?.totalEquipment || 0} icon={<Wrench />} color="blue" />
        <StatCard label="Operational" value={stats?.operationalCount || 0} icon={<CheckCircle />} color="green" subtitle={`${Math.round((stats?.operationalCount || 0) / (stats?.totalEquipment || 1) * 100)}% of fleet`} />
        <StatCard label="Open Alerts" value={stats?.openAlerts || 0} icon={<AlertTriangle />} color={(stats?.criticalAlerts || 0) > 0 ? "red" : "yellow"} subtitle={`${stats?.criticalAlerts || 0} critical`} />
        <StatCard label="Work Orders" value={stats?.openWorkOrders || 0} icon={<Activity />} color={(stats?.emergencyWorkOrders || 0) > 0 ? "red" : "blue"} subtitle={`${stats?.emergencyWorkOrders || 0} emergency`} />
        <StatCard label="In Warning" value={stats?.warningCount || 0} icon={<AlertTriangle />} color="yellow" />
        <StatCard label="Critical" value={stats?.criticalCount || 0} icon={<XCircle />} color="red" />
        <StatCard label="Overdue Inspections" value={stats?.overdueInspections || 0} icon={<ClipboardList />} color={(stats?.overdueInspections || 0) > 0 ? "red" : "gray"} />
        <StatCard label="Recent Anomalies" value={stats?.recentAnomalies || 0} icon={<Zap />} color={(stats?.recentAnomalies || 0) > 10 ? "orange" : "gray"} subtitle="Last 7 days" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alerts & Anomalies — Last 7 Days</CardTitle>
          </CardHeader>
          {trend && (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px" }} labelStyle={{ color: "#f9fafb" }} />
                <Area type="monotone" dataKey="alerts" stroke="#ef4444" fill="url(#alertGrad)" name="Alerts" />
                <Area type="monotone" dataKey="anomalies" stroke="#f59e0b" fill="url(#anomalyGrad)" name="Anomalies" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
          </CardHeader>
          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={STATUS_PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px" }} />
                <Legend formatter={(v) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Equipment */}
        <Card>
          <CardHeader>
            <CardTitle>Requires Attention</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {criticalEquipment?.length === 0 && (
              <p className="text-gray-500 text-sm">All equipment operating normally</p>
            )}
            {criticalEquipment?.map((eq: any) => (
              <div key={eq.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => navigate(`/equipment/${eq.id}`)}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(eq.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{eq.name}</p>
                  <p className="text-xs text-gray-500 truncate">{eq.facility}</p>
                </div>
                <Badge className={statusColor(eq.status)}>{eq.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {recentAlerts?.slice(0, 6).map((alert: Alert) => (
              <div key={alert.id} className="flex items-start gap-2.5 py-2 border-b border-gray-800 last:border-0">
                <div className={`mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${severityColor(alert.severity)}`}>
                  {alert.severity.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{timeAgo(alert.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Work Orders</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {upcomingWorkOrders?.map((wo: WorkOrder) => (
              <div key={wo.id} className="p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => navigate(`/work-orders`)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white truncate flex-1">{wo.title}</span>
                  <Badge className={wo.priority === "emergency" ? "text-red-400 bg-red-400/10 border-red-400/30" : "text-gray-400 bg-gray-800 border-gray-700"}>{wo.priority}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={11} />
                  <span>{wo.dueDate ? `Due ${formatDate(wo.dueDate)}` : "No due date"}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
