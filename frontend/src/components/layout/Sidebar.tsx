import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Wrench, Bell, ClipboardList, Activity,
  Users, Settings, LogOut, ChevronRight, Shield
} from "lucide-react";
import { cn } from "../../utils";
import { useAuthStore } from "../../services/store";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/equipment", icon: Wrench, label: "Equipment" },
  { path: "/alerts", icon: Bell, label: "Alerts" },
  { path: "/inspections", icon: ClipboardList, label: "Inspections" },
  { path: "/work-orders", icon: Activity, label: "Work Orders" },
  { path: "/predictions", icon: Shield, label: "Predictions" },
  { path: "/users", icon: Users, label: "Users" },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white" size={18} />
          </div>
          <div>
            <span className="text-white font-bold text-lg leading-none">RigGuard</span>
            <p className="text-xs text-gray-500 mt-0.5">Predictive Maintenance</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                isActive
                  ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-800">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role} · {user.department}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
