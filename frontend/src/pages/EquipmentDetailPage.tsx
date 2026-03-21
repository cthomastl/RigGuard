import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Activity, AlertTriangle, ClipboardList, Wrench, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { equipmentApi, sensorsApi, predictionApi } from "../services/api";
import { Badge } from "../components/ui/Badge";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatCard } from "../components/ui/StatCard";
import { statusColor, statusDot, criticalityColor, severityColor, inspectionStatusColor, formatDate, formatDateTime, riskColor } from "../utils";
import { Sensor, Alert, Inspection, WorkOrder } from "../types";
import { useState } from "react";

function SensorChart({ sensor }: { sensor: Sensor }) {
  const { data: readings = [] } = useQuery({
    queryKey: ["sensor-readings", sensor.id],
    queryFn: () => sensorsApi.readings(sensor.id, 24).then(r => r.data),
    refetchInterval: 60000,
  });

  const chartData = readings.map((r: any) => ({
    time: new Date(r.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: r.value,
    anomaly: r.anomaly ? r.value : null,
  }));

  const latest = readings[readings.length - 1];
  const isWarning = sensor.warningMaxThreshold && latest?.value > sensor.warningMaxThreshold;
  const isCritical = sensor.maxThreshold && latest?.value > sensor.maxThreshold;

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-white">{sensor.name}</p>
          <p className="text-xs text-gray-500 capitalize">{sensor.sensorType}</p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "text-green-400"}`}>
            {latest?.value?.toFixed(2) ?? "—"} <span className="text-sm font-normal text-gray-400">{sensor.unit}</span>
          </p>
          <p className="text-xs text-gray-500">Max: {sensor.maxThreshold} {sensor.unit}</p>
        </div>
      </div>
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} />
            <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "6px", fontSize: 11 }} />
            {sensor.maxThreshold && <ReferenceLine y={sensor.maxThreshold} stroke="#ef4444" strokeDasharray="4 2" />}
            {sensor.warningMaxThreshold && <ReferenceLine y={sensor.warningMaxThreshold} stroke="#eab308" strokeDasharray="4 2" />}
            <Line type="monotone" dataKey="value" stroke="#38bdf8" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"sensors" | "alerts" | "inspections" | "workorders" | "predictions">("sensors");

  const { data: eq, isLoading } = useQuery({
    queryKey: ["equipment", id],
    queryFn: () => equipmentApi.get(parseInt(id!)).then(r => r.data),
  });

  const { data: prediction } = useQuery({
    queryKey: ["prediction", id],
    queryFn: () => predictionApi.equipmentPrediction(parseInt(id!)).then(r => r.data),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
    </div>
  );
  if (!eq) return <div className="p-6 text-gray-400">Equipment not found</div>;

  const tabs = [
    { key: "sensors", label: "Sensors", icon: Activity, count: eq.sensors?.length },
    { key: "alerts", label: "Alerts", icon: AlertTriangle, count: eq.alerts?.length },
    { key: "inspections", label: "Inspections", icon: ClipboardList, count: eq.inspections?.length },
    { key: "workorders", label: "Work Orders", icon: Wrench, count: eq.workOrders?.length },
    { key: "predictions", label: "AI Predictions", icon: TrendingUp },
  ] as const;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/equipment")}><ArrowLeft size={16} /> Back</Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-3 h-3 rounded-full ${statusDot(eq.status)}`} />
            <h1 className="text-2xl font-bold text-white">{eq.name}</h1>
            <Badge className={statusColor(eq.status)}>{eq.status}</Badge>
          </div>
          <p className="text-gray-400 text-sm">{eq.type} · {eq.facility} · {eq.location}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Model" value={eq.model || "—"} color="gray" />
        <StatCard label="Serial Number" value={eq.serialNumber || "—"} color="gray" />
        <StatCard label="Installed" value={formatDate(eq.installationDate)} color="blue" />
        <StatCard label="Last Maintenance" value={formatDate(eq.lastMaintenanceDate)} color={eq.lastMaintenanceDate ? "green" : "red"} />
      </div>

      {/* Criticality + Notes */}
      <Card>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Criticality Level</p>
            <p className={`text-lg font-bold uppercase ${criticalityColor(eq.criticalityLevel)}`}>{eq.criticalityLevel}</p>
          </div>
          {eq.notes && (
            <div className="flex-1 border-l border-gray-800 pl-4">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-300">{eq.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex gap-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? "border-brand-500 text-brand-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            >
              <Icon size={15} /> {label}
              {count !== undefined && count > 0 && (
                <span className="bg-gray-800 text-gray-400 text-xs rounded px-1.5 py-0.5">{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "sensors" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {eq.sensors?.map((s: Sensor) => <SensorChart key={s.id} sensor={s} />)}
          {!eq.sensors?.length && <p className="text-gray-500 text-sm">No sensors configured for this equipment.</p>}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="space-y-3">
          {eq.alerts?.map((alert: Alert) => (
            <div key={alert.id} className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <Badge className={severityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
              <div className="flex-1">
                <p className="text-sm text-white">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDateTime(alert.createdAt)} · {alert.status}</p>
              </div>
            </div>
          ))}
          {!eq.alerts?.length && <p className="text-gray-500 text-sm">No alerts for this equipment.</p>}
        </div>
      )}

      {activeTab === "inspections" && (
        <div className="space-y-3">
          {eq.inspections?.map((ins: Inspection) => (
            <div key={ins.id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-white">{ins.inspectionType}</p>
                <Badge className={inspectionStatusColor(ins.status)}>{ins.status.replace("_", " ")}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                <div>Scheduled: {formatDate(ins.scheduledDate)}</div>
                <div>Completed: {formatDate(ins.completedDate)}</div>
              </div>
              {ins.findings && <p className="mt-2 text-sm text-yellow-400/80 bg-yellow-400/5 rounded p-2">{ins.findings}</p>}
            </div>
          ))}
          {!eq.inspections?.length && <p className="text-gray-500 text-sm">No inspections recorded.</p>}
        </div>
      )}

      {activeTab === "workorders" && (
        <div className="space-y-3">
          {eq.workOrders?.map((wo: WorkOrder) => (
            <div key={wo.id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-white">{wo.title}</p>
                <div className="flex gap-2">
                  <Badge className={wo.priority === "emergency" ? "text-red-400 bg-red-400/10 border-red-400/30" : "text-gray-400 bg-gray-800 border-gray-700"}>{wo.priority}</Badge>
                  <Badge className="text-blue-400 bg-blue-400/10 border-blue-400/30">{wo.status.replace("_", " ")}</Badge>
                </div>
              </div>
              <p className="text-sm text-gray-400">{wo.description}</p>
              {wo.dueDate && <p className="text-xs text-gray-500 mt-2">Due: {formatDate(wo.dueDate)}</p>}
            </div>
          ))}
          {!eq.workOrders?.length && <p className="text-gray-500 text-sm">No work orders.</p>}
        </div>
      )}

      {activeTab === "predictions" && (
        <div className="space-y-4">
          {prediction ? (
            <>
              <div className={`p-4 rounded-xl border ${prediction.overall_risk === "critical" ? "bg-red-400/5 border-red-400/20" : prediction.overall_risk === "high" ? "bg-orange-400/5 border-orange-400/20" : prediction.overall_risk === "medium" ? "bg-yellow-400/5 border-yellow-400/20" : "bg-green-400/5 border-green-400/20"}`}>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overall Risk Level</p>
                <p className={`text-3xl font-bold uppercase ${riskColor(prediction.overall_risk)}`}>{prediction.overall_risk}</p>
                <p className="text-xs text-gray-500 mt-1">Risk Score: {(prediction.overall_risk_score * 100).toFixed(1)}% · Generated {formatDateTime(prediction.generated_at)}</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {prediction.predictions?.map((p: any) => (
                  <div key={p.sensor_id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-white text-sm">{p.sensor_name}</p>
                      <Badge className={p.risk_score > 0.6 ? "text-red-400 bg-red-400/10 border-red-400/30" : p.risk_score > 0.3 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" : "text-green-400 bg-green-400/10 border-green-400/30"}>
                        Risk: {(p.risk_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div>Current: <span className="text-white">{p.current_value?.toFixed(2)} {p.unit}</span></div>
                      <div>Anomaly: <span className="text-white">{(p.anomaly_score * 100).toFixed(1)}%</span></div>
                      <div>Trend: <span className={p.trend_direction === "increasing" ? "text-yellow-400" : p.trend_direction === "decreasing" ? "text-blue-400" : "text-green-400"}>{p.trend_direction}</span></div>
                      <div>RUL: <span className={p.rul_days && p.rul_days < 30 ? "text-red-400" : "text-white"}>{p.rul_days ? `${p.rul_days} days` : "N/A"}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Prediction service unavailable or no sensor data.</p>
          )}
        </div>
      )}
    </div>
  );
}
