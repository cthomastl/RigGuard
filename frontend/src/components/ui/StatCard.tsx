import { cn } from "../../utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: "green" | "yellow" | "red" | "blue" | "gray" | "orange";
  trend?: string;
  subtitle?: string;
}

const colorMap = {
  green: { text: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
  red: { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
  blue: { text: "text-brand-400", bg: "bg-brand-400/10", border: "border-brand-400/20" },
  gray: { text: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20" },
  orange: { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
};

export function StatCard({ label, value, icon, color = "blue", subtitle }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("bg-gray-900 border rounded-xl p-5 flex items-start gap-4", c.border)}>
      {icon && (
        <div className={cn("p-2.5 rounded-lg flex-shrink-0", c.bg)}>
          <div className={cn("w-5 h-5", c.text)}>{icon}</div>
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <p className={cn("text-3xl font-bold", c.text)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
