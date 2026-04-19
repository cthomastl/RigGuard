import { useQuery } from "@tanstack/react-query";
import { equipmentApi, predictionApi } from "../services/api";
import { Equipment } from "../types";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { riskColor, criticalityColor } from "../utils";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useState } from "react";

function EquipmentPredictionCard({ equipment }: { equipment: Equipment }) {
  const { data: pred, isLoading } = useQuery({
    queryKey: ["prediction", equipment.id],
    queryFn: () => predictionApi.equipmentPrediction(equipment.id).then(r => r.data),
    retry: false,
  });

  const TrendIcon = ({ dir }: { dir: string }) =>
    dir === "increasing" ? <TrendingUp size={12} className="text-yellow-400" /> :
    dir === "decreasing" ? <TrendingDown size={12} className="text-blue-400" /> :
    <Minus size={12} className="text-green-400" />;

  return (
    <div className={`bg-gray-900 border rounded-xl p-5 ${
      pred?.overall_risk === "critical" ? "border-red-400/30" :
      pred?.overall_risk === "high" ? "border-orange-400/30" :
      pred?.overall_risk === "medium" ? "border-yellow-400/30" :
      "border-gray-800"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-sm">{equipment.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{equipment.facility}</p>
        </div>
        <div className="text-right">
          <span className={`text-xs font-medium uppercase ${criticalityColor(equipment.criticalityLevel)}`}>
            {equipment.criticalityLevel} crit
          </span>
          {pred && (
            <div className="mt-1">
              <Badge className={
                pred.overall_risk === "critical" ? "text-red-400 bg-red-400/10 border-red-400/30" :
                pred.overall_risk === "high" ? "text-orange-400 bg-orange-400/10 border-orange-400/30" :
                pred.overall_risk === "medium" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" :
                "text-green-400 bg-green-400/10 border-green-400/30"
              }>{pred.overall_risk} risk</Badge>
            </div>
          )}
        </div>
      </div>

      {isLoading && <div className="h-16 bg-gray-800 rounded animate-pulse" />}

      {pred && pred.predictions?.length > 0 && (
        <div className="space-y-2">
          {pred.predictions.slice(0, 4).map((p: any) => (
            <div key={p.sensor_id} className="flex items-center gap-3 text-xs">
              <TrendIcon dir={p.trend_direction} />
              <span className="text-gray-400 flex-1 truncate">{p.sensor_name}</span>
              <span className="text-gray-300">{p.current_value?.toFixed(1)} {p.unit}</span>
              {p.rul_days !== null && (
                <span className={p.rul_days < 30 ? "text-red-400 font-medium" : "text-gray-500"}>
                  {p.rul_days < 999 ? `${p.rul_days}d RUL` : ""}
                </span>
              )}
              <div className="w-16 bg-gray-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${p.risk_score > 0.6 ? "bg-red-400" : p.risk_score > 0.3 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${Math.min(100, p.risk_score * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {pred && pred.predictions?.length === 0 && (
        <p className="text-xs text-gray-500">No sensor data available for prediction.</p>
      )}

      {!pred && !isLoading && (
        <p className="text-xs text-gray-500">Prediction service unavailable.</p>
      )}
    </div>
  );
}

export function PredictionsPage() {
  const [riskFilter, setRiskFilter] = useState("");

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => equipmentApi.list().then(r => r.data),
  });

  // Filter by criticality as proxy for risk priority
  const filtered = equipment.filter((e: Equipment) =>
    !riskFilter ||
    (riskFilter === "critical" && (e.status === "critical" || e.criticalityLevel === "critical")) ||
    (riskFilter === "warning" && e.status === "warning") ||
    (riskFilter === "operational" && e.status === "operational")
  );

  // Fleet risk overview for chart
  const statusDist = [
    { name: "Operational", value: equipment.filter((e: Equipment) => e.status === "operational").length, fill: "#22c55e" },
    { name: "Warning", value: equipment.filter((e: Equipment) => e.status === "warning").length, fill: "#eab308" },
    { name: "Critical", value: equipment.filter((e: Equipment) => e.status === "critical").length, fill: "#ef4444" },
    { name: "Maintenance", value: equipment.filter((e: Equipment) => e.status === "maintenance").length, fill: "#3b82f6" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Predictions</h1>
          <p className="text-gray-400 text-sm mt-0.5">Anomaly detection & remaining useful life estimates</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
          <Shield size={14} className="text-brand-400" />
          Powered by Isolation Forest ML
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} className="text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-1">Anomaly Detection</p>
              <p className="text-xs text-gray-500">Isolation Forest ML model detects unusual sensor patterns vs. historical baseline</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-1">RUL Estimation</p>
              <p className="text-xs text-gray-500">Remaining Useful Life calculated from degradation rate and threshold margin</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-1">Risk Scoring</p>
              <p className="text-xs text-gray-500">Composite risk score from anomaly rate, trend direction, and RUL across all sensors</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fleet Overview Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Fleet Risk Distribution</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px" }} />
              <Bar dataKey="value" radius={4}>
                {statusDist.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Equipment Risk Analysis</CardTitle>
            <select className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
              <option value="">All Equipment</option>
              <option value="critical">Critical Status</option>
              <option value="warning">Warning Status</option>
              <option value="operational">Operational</option>
            </select>
          </CardHeader>
          <p className="text-xs text-gray-500 mb-4">
            Showing real-time ML predictions for {filtered.length} equipment units. RUL = Remaining Useful Life.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {filtered.map((eq: Equipment) => (
              <EquipmentPredictionCard key={eq.id} equipment={eq} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
