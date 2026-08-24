import { ReportMR, ReportOPV } from "@/lib/types";
import { FileText } from "lucide-react";

interface DataTableProps {
  title: string;
  subtitle: string;
  total: number;
  totalLabel: string;
  color: "indigo" | "violet";
  reports: (ReportMR | ReportOPV)[];
  valueField: "balita_mr" | "balita_opv";
}

export default function DataTable({
  title,
  subtitle,
  total,
  totalLabel,
  color,
  reports,
  valueField,
}: DataTableProps) {
  const isIndigo = color === "indigo";

  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center ${
                isIndigo ? "bg-indigo-50" : "bg-violet-50"
              }`}
            >
              <FileText
                className={`w-4 h-4 ${
                  isIndigo ? "text-indigo-600" : "text-violet-600"
                }`}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
              isIndigo
                ? "text-indigo-600 bg-indigo-50"
                : "text-violet-600 bg-violet-50"
            }`}
          >
            {totalLabel}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Puskesmas
              </th>
              <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Count
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.length > 0 ? (
              reports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-slate-50/50 transition-colors duration-100"
                >
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium text-slate-700">
                      {new Date(report.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-600">
                      {report.puskesmas || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`inline-flex items-center text-sm font-semibold px-2.5 py-1 rounded-md ${
                        isIndigo
                          ? "text-indigo-700 bg-indigo-50"
                          : "text-violet-700 bg-violet-50"
                      }`}
                    >
                      {String((report as unknown as Record<string, number>)[valueField])}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <FileText className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-500">
                      No reports yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Reports will appear here once submitted
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
