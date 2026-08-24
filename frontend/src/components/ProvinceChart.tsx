"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ProvinceChartProps {
  labels: string[];
  data: number[];
}

const COLORS = [
  "rgba(99, 102, 241, 0.85)",
  "rgba(139, 92, 246, 0.85)",
  "rgba(168, 85, 247, 0.85)",
  "rgba(192, 132, 252, 0.85)",
  "rgba(129, 140, 248, 0.85)",
  "rgba(167, 139, 250, 0.85)",
  "rgba(147, 197, 253, 0.85)",
  "rgba(196, 181, 253, 0.85)",
];

export default function ProvinceChart({ labels, data }: ProvinceChartProps) {
  const chartData = labels.map((label, i) => ({
    name: label
      .replace("Kab. ", "")
      .replace("Kota ", "")
      .replace("Kep. ", ""),
    value: data[i],
  }));

  return (
    <div className="bg-white rounded-md p-6 shadow-sm border border-slate-200/60">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-900">By Province</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Top provinces by MR reports
        </p>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis
              type="number"
              tick={{ fontSize: 10, fontWeight: 500, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11, fontWeight: 500, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                borderRadius: 8,
                border: "none",
                color: "#fff",
                fontSize: 12,
              }}
              formatter={(value) => [
                `${Number(value).toLocaleString()} reports`,
                "",
              ]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
