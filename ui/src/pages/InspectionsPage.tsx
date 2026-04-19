import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ClipboardList, Calendar, User, AlertTriangle, CheckCircle } from "lucide-react";
import { inspectionsApi, equipmentApi, usersApi } from "../services/api";
import { Inspection, Equipment, User as UserType } from "../types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Card } from "../components/ui/Card";
import { inspectionStatusColor, priorityColor, formatDate } from "../utils";

const INSPECTION_TYPES = ["Routine Mechanical", "Vibration Analysis", "Corrosion Inspection", "Safety & HSE", "Electrical Inspection", "Non-Destructive Testing", "Pressure Test", "API 510/570 Inspection", "Emergency Safety Inspection", "Fouling & Efficiency Check", "Annual Overhaul Inspection"];

function InspectionForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: equipment = [] } = useQuery({ queryKey: ["equipment"], queryFn: () => equipmentApi.list().then(r => r.data) });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list().then(r => r.data) });

  const [form, setForm] = useState({
    equipmentId: "",
    inspectorId: "",
    inspectionType: INSPECTION_TYPES[0],
    scheduledDate: new Date().toISOString().slice(0, 10),
    priority: "medium",
    checklist: "",
  });

  const mutation = useMutation({
    mutationFn: () => inspectionsApi.create({
      ...form,
      equipmentId: parseInt(form.equipmentId),
      inspectorId: form.inspectorId ? parseInt(form.inspectorId) : null,
      checklist: form.checklist ? JSON.stringify(form.checklist.split("\n").filter(Boolean)) : "[]",
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inspections"] }); onClose(); },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Equipment *</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.equipmentId} onChange={e => setForm(p => ({ ...p, equipmentId: e.target.value }))}>
            <option value="">Select equipment...</option>
            {equipment.map((e: Equipment) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Inspection Type *</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.inspectionType} onChange={e => setForm(p => ({ ...p, inspectionType: e.target.value }))}>
            {INSPECTION_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Priority *</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
            <option value="low">Low</option><option value="medium">Medium</option>
            <option value="high">High</option><option value="emergency">Emergency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Scheduled Date *</label>
          <input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Assigned Inspector</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.inspectorId} onChange={e => setForm(p => ({ ...p, inspectorId: e.target.value }))}>
            <option value="">Unassigned</option>
            {users.filter((u: UserType) => ["inspector", "engineer"].includes(u.role)).map((u: UserType) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Checklist Items (one per line)</label>
          <textarea rows={5} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 resize-none" placeholder="Check bearing temperatures&#10;Inspect seals and gaskets&#10;Verify alignment..." value={form.checklist} onChange={e => setForm(p => ({ ...p, checklist: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.equipmentId}>
          {mutation.isPending ? "Scheduling..." : "Schedule Inspection"}
        </Button>
      </div>
    </div>
  );
}

function CompleteInspectionModal({ inspection, onClose }: { inspection: Inspection; onClose: () => void }) {
  const qc = useQueryClient();
  const [findings, setFindings] = useState(inspection.findings || "");
  const [recommendations, setRecommendations] = useState(inspection.recommendations || "");
  const [nextDate, setNextDate] = useState("");

  const mutation = useMutation({
    mutationFn: () => inspectionsApi.update(inspection.id, {
      status: "completed",
      completedDate: new Date().toISOString().slice(0, 10),
      findings,
      recommendations,
      nextInspectionDate: nextDate || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inspections"] }); onClose(); },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Findings</label>
        <textarea rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 resize-none" value={findings} onChange={e => setFindings(e.target.value)} placeholder="Document inspection findings..." />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Recommendations</label>
        <textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 resize-none" value={recommendations} onChange={e => setRecommendations(e.target.value)} placeholder="Recommended actions..." />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Next Inspection Date</label>
        <input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={nextDate} onChange={e => setNextDate(e.target.value)} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <CheckCircle size={16} /> {mutation.isPending ? "Completing..." : "Mark Complete"}
        </Button>
      </div>
    </div>
  );
}

export function InspectionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [completing, setCompleting] = useState<Inspection | null>(null);

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["inspections", statusFilter, priorityFilter],
    queryFn: () => inspectionsApi.list({ ...(statusFilter ? { status: statusFilter } : {}), ...(priorityFilter ? { priority: priorityFilter } : {}) }).then(r => r.data),
  });

  const overdue = inspections.filter((i: Inspection) => i.status === "overdue").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inspection Workflow</h1>
          <p className="text-gray-400 text-sm mt-0.5">{inspections.length} inspections · {overdue} overdue</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus size={16} /> Schedule Inspection</Button>
      </div>

      {overdue > 0 && (
        <div className="flex items-center gap-3 bg-red-400/5 border border-red-400/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertTriangle size={16} />
          {overdue} inspection{overdue > 1 ? "s are" : " is"} overdue and require immediate scheduling.
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-500" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priority</option>
          <option value="emergency">Emergency</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Inspection Cards */}
      <div className="space-y-3">
        {isLoading && [...Array(5)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-24 animate-pulse" />)}
        {!isLoading && inspections.map((ins: Inspection) => {
          const checklist = (() => { try { return JSON.parse(ins.checklist || "[]"); } catch { return []; } })();
          return (
            <div key={ins.id} className={`bg-gray-900 border rounded-xl p-5 ${ins.status === "overdue" ? "border-red-400/30" : ins.priority === "emergency" ? "border-orange-400/30" : "border-gray-800"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{ins.inspectionType}</h3>
                    <Badge className={priorityColor(ins.priority)}>{ins.priority}</Badge>
                    <Badge className={inspectionStatusColor(ins.status)}>{ins.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-gray-400">{ins.equipment?.name} · {ins.equipment?.facility}</p>
                </div>
                <div className="flex gap-2">
                  {(ins.status === "scheduled" || ins.status === "in_progress" || ins.status === "overdue") && (
                    <Button size="sm" onClick={() => setCompleting(ins)}>
                      <CheckCircle size={13} /> Complete
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={13} />
                  <span>{formatDate(ins.scheduledDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <User size={13} />
                  <span>{ins.inspector?.name || "Unassigned"}</span>
                </div>
                <div className="text-gray-500">
                  {checklist.length > 0 && `${checklist.length} checklist items`}
                </div>
              </div>
              {ins.findings && (
                <div className="mt-3 text-sm text-yellow-400/80 bg-yellow-400/5 rounded-lg p-3">
                  <span className="font-medium">Findings: </span>{ins.findings}
                </div>
              )}
              {checklist.length > 0 && ins.status !== "completed" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {checklist.slice(0, 3).map((item: string, i: number) => (
                    <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">{item}</span>
                  ))}
                  {checklist.length > 3 && <span className="text-xs text-gray-500">+{checklist.length - 3} more</span>}
                </div>
              )}
            </div>
          );
        })}
        {!isLoading && inspections.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ClipboardList className="mx-auto mb-2 opacity-40" size={32} />
            No inspections found
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Schedule Inspection" size="lg">
        <InspectionForm onClose={() => setShowAdd(false)} />
      </Modal>

      {completing && (
        <Modal isOpen={true} onClose={() => setCompleting(null)} title={`Complete: ${completing.inspectionType}`}>
          <CompleteInspectionModal inspection={completing} onClose={() => setCompleting(null)} />
        </Modal>
      )}
    </div>
  );
}
