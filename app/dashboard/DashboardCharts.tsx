// app/dashboard/DashboardCharts.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatCompact = (v: number) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v}`;
};

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
        borderRadius: "12px",
        border: `1px solid ${border}`,
        boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.15)",
        background: bg,
        color,
        fontSize: "12px",
        padding: "10px 14px",
      }}
      labelStyle={{ fontWeight: 700, marginBottom: 4, color }}
    />
  );
}

type ChartView = "bar" | "area";

// ─── Gráfico Financeiro: Balanço com toggle bar/area + resumo ────────────────
export function FinancialChart({ data }: { data: { name: string; receitas: number; despesas: number }[] }) {
  const isDark    = useIsDark();
  const grid      = isDark ? "#27272a" : "#f4f4f5";
  const tickColor = "#71717a";
  const [view, setView] = useState<ChartView>("bar");

  // Resumo
  const summary = useMemo(() => {
    const totalReceitas = data.reduce((s, d) => s + d.receitas, 0);
    const totalDespesas = data.reduce((s, d) => s + d.despesas, 0);
    const saldo = totalReceitas - totalDespesas;
    return { totalReceitas, totalDespesas, saldo };
  }, [data]);

  const isEmpty = data.every(d => d.receitas === 0 && d.despesas === 0);

  return (
    <div>
      {/* Top row: summary chips + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Mini KPIs com labels */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-0.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/60 uppercase tracking-wider leading-none">Entradas</span>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums leading-tight">{formatBRL(summary.totalReceitas)}</span>
          </div>
          <div className="flex flex-col gap-0.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
            <span className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/60 uppercase tracking-wider leading-none">Saídas</span>
            <span className="text-sm font-black text-rose-700 dark:text-rose-400 tabular-nums leading-tight">{formatBRL(summary.totalDespesas)}</span>
          </div>
          <div className={`flex flex-col gap-0.5 px-3 py-1.5 rounded-xl border ${
            summary.saldo >= 0
              ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-500/30"
              : "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-500/30"
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider leading-none ${
              summary.saldo >= 0 ? "text-emerald-600/70 dark:text-emerald-400/60" : "text-red-600/70 dark:text-red-400/60"
            }`}>Saldo</span>
            <span className={`text-sm font-black tabular-nums leading-tight ${
              summary.saldo >= 0 ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"
            }`}>{summary.saldo >= 0 ? "+" : ""}{formatBRL(summary.saldo)}</span>
          </div>
        </div>
        {/* View toggle */}
        <div className="flex items-center h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden">
          <button
            onClick={() => setView("bar")}
            className={`flex items-center gap-1 h-full px-2.5 text-[11px] font-bold transition-all duration-150 ${
              view === "bar"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="2.5" height="7" rx="0.5" /><rect x="4.75" y="1" width="2.5" height="10" rx="0.5" /><rect x="8.5" y="5" width="2.5" height="6" rx="0.5" /></svg>
            Barras
          </button>
          <button
            onClick={() => setView("area")}
            className={`flex items-center gap-1 h-full px-2.5 text-[11px] font-bold transition-all duration-150 ${
              view === "area"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5"><polyline points="1,9 4,5 7,7 11,2" /><polyline points="1,9 4,7 7,8 11,5" /></svg>
            Área
          </button>
        </div>
      </div>

      {/* Chart */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[280px] text-zinc-400 dark:text-zinc-600">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 17V10m5 7V7m5 10v-4" /></svg>
          <p className="text-sm font-semibold">Sem movimentações no período</p>
        </div>
      ) : view === "bar" ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: tickColor }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: tickColor }}
              tickFormatter={formatCompact}
              width={55}
            />
            <ReferenceLine y={0} stroke={grid} />
            <ChartTooltip
              isDark={isDark}
              formatter={(v: number, name: string) => [formatBRL(v), name]}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingTop: "14px", color: tickColor }}
            />
            <Bar
              dataKey="receitas"
              name="Receitas"
              fill={isDark ? "#34d399" : "#10b981"}
              radius={[6, 6, 0, 0]}
              maxBarSize={44}
              animationBegin={100}
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="despesas"
              name="Despesas"
              fill={isDark ? "#fb7185" : "#f43f5e"}
              radius={[6, 6, 0, 0]}
              maxBarSize={44}
              animationBegin={250}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={isDark ? "#34d399" : "#10b981"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isDark ? "#34d399" : "#10b981"} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={isDark ? "#fb7185" : "#f43f5e"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isDark ? "#fb7185" : "#f43f5e"} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: tickColor }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: tickColor }}
              tickFormatter={formatCompact}
              width={55}
            />
            <ChartTooltip
              isDark={isDark}
              formatter={(v: number, name: string) => [formatBRL(v), name]}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingTop: "14px", color: tickColor }}
            />
            <Area
              type="monotone"
              dataKey="receitas"
              name="Receitas"
              stroke={isDark ? "#34d399" : "#10b981"}
              strokeWidth={2.5}
              fill="url(#gradReceitas)"
              animationBegin={100}
              animationDuration={800}
              animationEasing="ease-out"
              dot={{ r: 3, fill: isDark ? "#34d399" : "#10b981", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: isDark ? "#18181b" : "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="despesas"
              name="Despesas"
              stroke={isDark ? "#fb7185" : "#f43f5e"}
              strokeWidth={2.5}
              fill="url(#gradDespesas)"
              animationBegin={250}
              animationDuration={800}
              animationEasing="ease-out"
              dot={{ r: 3, fill: isDark ? "#fb7185" : "#f43f5e", strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: isDark ? "#18181b" : "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Gráfico de Rosca: Status do Pátio ────────────────────────────────────────
export function OSStatusChart({ data }: { data: any[] }) {
  const isDark = useIsDark();
  const grid   = isDark ? "#27272a" : "#e4e4e7";

  const isEmpty   = data.every((d) => d.value === 0);
  const total     = data.reduce((acc, d) => acc + d.value, 0);
  const chartData = isEmpty
    ? [{ name: "Sem Dados", value: 1, fill: grid }]
    : data;

  // Only items with value > 0 in the legend
  const legendItems = isEmpty ? [] : data.filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Donut */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
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
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        {!isEmpty && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
              {total}
            </span>
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
              total OS
            </span>
          </div>
        )}
      </div>

      {/* Custom legend grid — 2 columns, wraps on any screen */}
      {legendItems.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-1 pb-1">
          {legendItems.map((item) => (
            <div key={item.name} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate leading-tight">
                {item.name}
              </span>
              <span className="ml-auto text-xs font-black tabular-nums text-zinc-900 dark:text-zinc-100 shrink-0">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 pb-2">
          Nenhuma OS no período
        </p>
      )}
    </div>
  );
}
