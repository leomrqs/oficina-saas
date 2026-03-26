// app/dashboard/DashboardCharts.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

/** Hook seguro para SSR: devolve true só depois do hydrate */
function useIsDark() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && resolvedTheme === "dark";
}

// ─── Tooltip customizado para dark mode ───────────────────────────────────────
function ChartTooltip({ isDark, ...props }: any) {
  const bg     = isDark ? "#18181b" : "#ffffff";
  const border = isDark ? "#27272a" : "#e4e4e7";
  const color  = isDark ? "#e4e4e7" : "#18181b";
  return (
    <Tooltip
      {...props}
      cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 6 }}
      contentStyle={{
        borderRadius: "10px",
        border: `1px solid ${border}`,
        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.15)",
        background: bg,
        color,
        fontSize: "12px",
        padding: "8px 12px",
      }}
      labelStyle={{ fontWeight: 700, marginBottom: 4, color }}
    />
  );
}

// ─── Gráfico de Barras: Balanço Financeiro ────────────────────────────────────
export function FinancialChart({ data }: { data: any[] }) {
  const isDark    = useIsDark();
  const grid      = isDark ? "#27272a" : "#f4f4f5";
  const tickColor = "#71717a";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: tickColor }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: tickColor }}
          tickFormatter={(v) => `R$${v}`}
          width={60}
        />
        <ChartTooltip
          isDark={isDark}
          formatter={(v: number, name: string) => [formatBRL(v), name]}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: "12px", paddingTop: "20px", color: tickColor }}
        />
        <Bar
          dataKey="receitas"
          name="Receitas"
          fill="#10b981"
          radius={[6, 6, 0, 0]}
          maxBarSize={52}
          animationBegin={200}
          animationDuration={700}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="despesas"
          name="Despesas"
          fill="#f43f5e"
          radius={[6, 6, 0, 0]}
          maxBarSize={52}
          animationBegin={400}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Gráfico de Rosca: Status do Pátio ────────────────────────────────────────
export function OSStatusChart({ data }: { data: any[] }) {
  const isDark    = useIsDark();
  const grid      = isDark ? "#27272a" : "#e4e4e7";
  const tickColor = "#71717a";

  const isEmpty = data.every((d) => d.value === 0);
  const total   = data.reduce((acc, d) => acc + d.value, 0);
  const chartData = isEmpty
    ? [{ name: "Sem Dados", value: 1, fill: grid }]
    : data;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="44%"
            innerRadius={72}
            outerRadius={100}
            paddingAngle={isEmpty ? 0 : 4}
            dataKey="value"
            stroke="none"
            animationBegin={300}
            animationDuration={900}
            animationEasing="ease-out"
          >
            {chartData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.fill} />
            ))}
          </Pie>

          {!isEmpty && (
            <ChartTooltip
              isDark={isDark}
              formatter={(v: number) => [`${v} OS`, ""]}
            />
          )}

          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", color: tickColor }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Label central da rosca */}
      {!isEmpty && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center"
          style={{ top: "calc(44% - 24px)", transform: "translateX(-50%) translateY(-50%)" }}
        >
          <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
            {total}
          </span>
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
            total OS
          </span>
        </div>
      )}
    </div>
  );
}
