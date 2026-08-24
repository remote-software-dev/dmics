import { LucideIcon, CheckCircle } from "lucide-react";

interface CoverageCardProps {
  title: string;
  subtitle: string;
  percentage: number;
  vaccinated: number;
  population: number;
  color: "indigo" | "violet";
}

export default function CoverageCard({
  title,
  subtitle,
  percentage,
  vaccinated,
  population,
  color,
}: CoverageCardProps) {
  const isIndigo = color === "indigo";

  return (
    <div className="bg-white rounded-md p-6 shadow-sm border border-slate-200/60">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center shadow-md ${
              isIndigo
                ? "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20"
                : "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20"
            }`}
          >
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span
          className={`text-2xl font-bold ${
            isIndigo ? "text-indigo-600" : "text-violet-600"
          }`}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full progress-animate transition-all duration-1000 ${
              isIndigo
                ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                : "bg-gradient-to-r from-violet-500 to-purple-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-md p-3">
          <p className="text-xs font-medium text-slate-500 mb-1">Vaccinated</p>
          <p className="text-lg font-bold text-slate-900">
            {vaccinated.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-50 rounded-md p-3">
          <p className="text-xs font-medium text-slate-500 mb-1">Population</p>
          <p className="text-lg font-bold text-slate-900">
            {population.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
