import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Activity, Clock, User, AlertTriangle, CheckCircle } from "lucide-react";
import { workOrdersApi, equipmentApi, usersApi } from "../services/api";
import { WorkOrder, Equipment, User as UserType } from "../types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { priorityColor, formatDate } from "../utils";

const WORK_TYPES = ["preventive", "corrective", "predictive", "emergency"];

function WorkOrderForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: equipment = [] } = useQuery({ queryKey: ["equipment"], queryFn: () => equipmentApi.list().then(r => r.data) });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list().then(r => r.data) });

  const [form, setForm] = useState({
    equipmentId: "", title: "", description: "", workType: "preventive",
    priority: "medium", assignedTo: "", estimatedHours: "", dueDate: "",
  });

  const mutation = useMutation({
    mutationFn: () => workOrdersApi.create({
      ...form,
      equipmentId: parseInt(form.equipmentId),
      assignedTo: form.assignedTo ? parseInt(form.assignedTo) : null,
      estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : null,
      dueDate: form.dueDate || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["work-orders"] }); onClose(); },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Title *</label>
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Work order title" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Equipment *</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.equipmentId} onChange={e => setForm(p => ({ ...p, equipmentId: e.target.value }))}>
            <option value="">Select...</option>
            {equipment.map((e: Equipment) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Work Type *</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.workType} onChange={e => setForm(p => ({ ...p, workType: e.target.value }))}>
            {WORK_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Priority</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
            <option value="low">Low</option><option value="medium">Medium</option>
            <option value="high">High</option><option value="emergency">Emergency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Assign To</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
            <option value="">Unassigned</option>
            {users.filter((u: UserType) => ["technician", "engineer"].includes(u.role)).map((u: UserType) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Est. Hours</label>
          <input type="number" step="0.5" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.estimatedHours} onChange={e => setForm(p => ({ ...p, estimatedHours: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Due Date</label>
          <input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Description *</label>
          <textarea rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detailed description of work to be performed..." />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.equipmentId || !form.title}>
          {mutation.isPending ? "Creating..." : "Create Work Order"}
        </Button>
      </div>
    </div>
  );
}

const STATUS_COLUMNS: Array<{ key: string; label: string; color: string }> = [
  { key: "open", label: "Open", color: "text-gray-400" },
  { key: "assigned", label: "Assigned", color: "text-blue-400" },
  { key: "in_progress", label: "In Progress", color: "text-yellow-400" },
  { key: "completed", label: "Completed", color: "text-green-400" },
];

export function WorkOrdersPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState("open,assigned,in_progress");

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ["work-orders", statusFilter],
    queryFn: () => workOrdersApi.list({ ...(statusFilter ? { status: statusFilter } : {}) }).then(r => r.data),
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => workOrdersApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-orders"] }),
  });

  const emergency = workOrders.filter((wo: WorkOrder) => wo.priority === "emergency" && wo.status !== "completed").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Orders</h1>
          <p className="text-gray-400 text-sm mt-0.5">{workOrders.length} orders · {emergency} emergency</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="open,assigned,in_progress">Active</option>
            <option value="completed">Completed</option>
            <option value="">All</option>
          </select>
          <Button onClick={() => setShowAdd(true)}><Plus size={16} /> New Work Order</Button>
        </div>
      </div>

      {emergency > 0 && (
        <div className="flex items-center gap-3 bg-red-400/5 border border-red-400/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertTriangle size={16} /> {emergency} emergency work order{emergency > 1 ? "s" : ""} require immediate attention.
        </div>
      )}

      {/* Work Orders List */}
      <div className="space-y-3">
        {isLoading && [...Array(5)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-28 animate-pulse" />)}
        {!isLoading && workOrders.map((wo: WorkOrder) => (
          <div key={wo.id} className={`bg-gray-900 border rounded-xl p-5 ${wo.priority === "emergency" ? "border-red-400/30" : "border-gray-800"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-white">{wo.title}</h3>
                  <Badge className={priorityColor(wo.priority)}>{wo.priority}</Badge>
                  <Badge className="text-gray-400 bg-gray-800 border-gray-700">{wo.workType}</Badge>
                </div>
                <p className="text-sm text-gray-500">{wo.equipment?.name} · {wo.equipment?.facility}</p>
              </div>
              <div className="flex gap-2 ml-4 flex-shrink-0">
                {wo.status === "open" && <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ id: wo.id, status: "assigned" })}>Assign</Button>}
                {wo.status === "assigned" && <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ id: wo.id, status: "in_progress" })}>Start</Button>}
                {wo.status === "in_progress" && <Button size="sm" onClick={() => updateStatus.mutate({ id: wo.id, status: "completed" })}><CheckCircle size={13} /> Complete</Button>}
                <Badge className={
                  wo.status === "completed" ? "text-green-400 bg-green-400/10 border-green-400/30" :
                  wo.status === "in_progress" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" :
                  wo.status === "assigned" ? "text-blue-400 bg-blue-400/10 border-blue-400/30" :
                  "text-gray-400 bg-gray-800 border-gray-700"
                }>{wo.status.replace("_", " ")}</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{wo.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {wo.assignee && <div className="flex items-center gap-1"><User size={12} />{wo.assignee.name}</div>}
              {wo.dueDate && <div className="flex items-center gap-1"><Clock size={12} />Due {formatDate(wo.dueDate)}</div>}
              {wo.estimatedHours && <div className="flex items-center gap-1"><Activity size={12} />{wo.estimatedHours}h estimated</div>}
            </div>
          </div>
        ))}
        {!isLoading && workOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Activity className="mx-auto mb-2 opacity-40" size={32} />
            No work orders found
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create Work Order" size="lg">
        <WorkOrderForm onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}
