import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { usersApi } from "../services/api";
import { User, UserRole } from "../types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  engineer: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  technician: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  inspector: "text-green-400 bg-green-400/10 border-green-400/30",
};

function UserForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "technician", department: "" });

  const mutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); onClose(); },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email *</label>
          <input type="email" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Password *</label>
          <input type="password" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Role</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="admin">Admin</option>
            <option value="engineer">Engineer</option>
            <option value="technician">Technician</option>
            <option value="inspector">Inspector</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Department</label>
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Field Ops, Engineering" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.email}>
          {mutation.isPending ? "Creating..." : "Create User"}
        </Button>
      </div>
    </div>
  );
}

export function UsersPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then(r => r.data),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">{users.length} team members</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add User</Button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading && [...Array(4)].map((_, i) => (
              <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td></tr>
            ))}
            {users.map((user: User) => (
              <tr key={user.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-600/20 rounded-full flex items-center justify-center text-brand-400 font-semibold text-sm">
                      {user.name[0]}
                    </div>
                    <span className="text-sm font-medium text-white">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                <td className="px-4 py-3"><Badge className={ROLE_COLORS[user.role]}>{user.role}</Badge></td>
                <td className="px-4 py-3 text-sm text-gray-400">{user.department || "—"}</td>
                <td className="px-4 py-3">
                  <Badge className={user.active ? "text-green-400 bg-green-400/10 border-green-400/30" : "text-gray-400 bg-gray-800 border-gray-700"}>
                    {user.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Team Member">
        <UserForm onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}
