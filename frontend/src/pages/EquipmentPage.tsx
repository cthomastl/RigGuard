import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Wrench, MapPin, Calendar } from "lucide-react";
import { equipmentApi } from "../services/api";
import { Equipment } from "../types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { statusColor, statusDot, criticalityColor, formatDate } from "../utils";

const EQUIPMENT_TYPES = ["Pump", "Compressor", "Pressure Vessel", "Valve", "Separator", "Heat Exchanger", "Flare System", "Pipeline", "Other"];
const FACILITIES = ["Offshore Platform Alpha", "Offshore Platform Beta", "Pipeline Network South", "Onshore Field Alpha"];
const CRITICALITIES = ["low", "medium", "high", "critical"];

function EquipmentForm({ onClose, initial }: { onClose: () => void; initial?: Equipment }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: initial?.name || "",
    type: initial?.type || "Pump",
    model: initial?.model || "",
    serialNumber: initial?.serialNumber || "",
    location: initial?.location || "",
    facility: initial?.facility || FACILITIES[0],
    criticalityLevel: initial?.criticalityLevel || "medium",
    installationDate: initial?.installationDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    notes: initial?.notes || "",
  });

  const mutation = useMutation({
    mutationFn: () => initial ? equipmentApi.update(initial.id, form) : equipmentApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipment"] }); onClose(); },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Equipment Name *</label>
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Centrifugal Pump CP-101" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Type *</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            {EQUIPMENT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Criticality</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.criticalityLevel} onChange={e => setForm(p => ({ ...p, criticalityLevel: e.target.value as any }))}>
            {CRITICALITIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Model</label>
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Serial Number</label>
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Facility *</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.facility} onChange={e => setForm(p => ({ ...p, facility: e.target.value }))}>
            {FACILITIES.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Location</label>
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Deck 2, Bay 3" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Installation Date *</label>
          <input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.installationDate} onChange={e => setForm(p => ({ ...p, installationDate: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Notes</label>
          <textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name}>
          {mutation.isPending ? "Saving..." : initial ? "Update Equipment" : "Add Equipment"}
        </Button>
      </div>
    </div>
  );
}

export function EquipmentPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment", statusFilter, facilityFilter],
    queryFn: () => equipmentApi.list({ ...(statusFilter ? { status: statusFilter } : {}), ...(facilityFilter ? { facility: facilityFilter } : {}) }).then(r => r.data),
    refetchInterval: 30000,
  });

  const filtered = equipment.filter((e: Equipment) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipment Registry</h1>
          <p className="text-gray-400 text-sm mt-0.5">{equipment.length} assets tracked</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Equipment</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
            placeholder="Search equipment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="operational">Operational</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="maintenance">Maintenance</option>
          <option value="offline">Offline</option>
        </select>
        <select className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-500" value={facilityFilter} onChange={e => setFacilityFilter(e.target.value)}>
          <option value="">All Facilities</option>
          {FACILITIES.map(f => <option key={f}>{f}</option>)}
        </select>
      </div>

      {/* Equipment Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((eq: Equipment) => (
            <Card key={eq.id} onClick={() => navigate(`/equipment/${eq.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(eq.status)}`} />
                    <h3 className="text-sm font-semibold text-white truncate">{eq.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500">{eq.type}</p>
                </div>
                <Badge className={statusColor(eq.status)}>{eq.status}</Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={11} />
                  <span className="truncate">{eq.facility}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Wrench size={11} />
                  <span>{eq.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={11} />
                  <span>Last maint: {formatDate(eq.lastMaintenanceDate)}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className={`text-xs font-medium ${criticalityColor(eq.criticalityLevel)}`}>
                  {eq.criticalityLevel.toUpperCase()} CRITICALITY
                </span>
                {(eq.alerts?.length || 0) > 0 && (
                  <Badge className="text-red-400 bg-red-400/10 border-red-400/30">
                    {eq.alerts?.length} alert{eq.alerts!.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Equipment" size="lg">
        <EquipmentForm onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}
