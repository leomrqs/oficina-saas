"use client";
// app/dashboard/SaasDashboardCharts.tsx
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const PLAN_COLORS: Record<string, string> = {
  Mensal: "#3b82f6",
  Trimestral: "#8b5cf6",
  Semestral: "#f59e0b",
  Anual: "#10b981",
};

const FALLBACK_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899"];

type PlanData = { name: string; count: number; revenue: number };
type GrowthData = { name: string; oficinas: number };

export function PlanDonutChart({ data }: { data: PlanData[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-zinc-400 text-sm">
        Sem dados de plano
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="count"
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={PLAN_COLORS[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string, props: any) => [
            `${value} oficina${value !== 1 ? "s" : ""}`,
            props.payload.name,
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e4e4e7",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            fontSize: "12px",
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: "12px" }}
          formatter={(value) => {
            const d = data.find((x) => x.name === value);
            return d ? `${value} (${d.count})` : value;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TenantGrowthChart({ data }: { data: GrowthData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-zinc-400 text-sm">
        Sem dados de crescimento
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e4e4e7",
            fontSize: "12px",
          }}
          formatter={(v: number) => [`${v} oficina${v !== 1 ? "s" : ""}`, "Cadastros"]}
        />
        <Bar dataKey="oficinas" name="Oficinas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
