import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "indigo" | "violet" | "emerald" | "amber";
  badge?: { label: string; variant?: "mr" | "opv" };
}

const colorMap = {
  indigo: {
    bg: "from-indigo-500 to-indigo-600",
    shadow: "shadow-indigo-500/25",
  },
  violet: {
    bg: "from-violet-500 to-violet-600",
    shadow: "shadow-violet-500/25",
  },
  emerald: {
    bg: "from-emerald-500 to-emerald-600",
    shadow: "shadow-emerald-500/25",
  },
  amber: {
    bg: "from-amber-500 to-orange-500",
    shadow: "shadow-amber-500/25",
  },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  badge,
}: StatsCardProps) {
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-md p-5 shadow-sm border border-slate-200/60 card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {badge && (
            <div className="flex items-center gap-2 mt-2">
              {badge.variant === "mr" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {badge.label}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-md bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg ${c.shadow}`}
        >
          <Icon className="w-6 h-6 text-white" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
