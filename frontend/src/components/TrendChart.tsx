"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendChartProps {
  dates: string[];
  mr: number[];
  opv: number[];
}

export default function TrendChart({ dates, mr, opv }: TrendChartProps) {
  const data = dates.map((date, i) => ({
    date,
    MR: mr[i],
    OPV: opv[i],
  }));

  return (
    <div className="bg-white rounded-md p-6 shadow-sm border border-slate-200/60 lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Daily Vaccination Trend
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Last 14 days MR vs OPV
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-xs font-medium text-slate-500">MR</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-xs font-medium text-slate-500">OPV</span>
          </div>
        </div>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontWeight: 500, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(data.length / 7)}
            />
            <YAxis
              tick={{ fontSize: 11, fontWeight: 500, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                borderRadius: 8,
                border: "none",
                color: "#fff",
                fontSize: 12,
              }}
              formatter={(value, name) => [
                Number(value).toLocaleString(),
                name,
              ]}
            />
            <Line
              type="monotone"
              dataKey="MR"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="rgba(99, 102, 241, 0.08)"
              dot={false}
              activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="OPV"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="rgba(139, 92, 246, 0.08)"
              dot={false}
              activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
