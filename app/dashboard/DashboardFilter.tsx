// app/dashboard/DashboardFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";

interface DashboardFilterProps {
  cycleDay?: number;
  defaultFrom?: string;
  defaultTo?: string;
}

interface QuickFilter {
  label: string;
  shortLabel: string;
  key: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  { label: "Hoje",         shortLabel: "Hoje",   key: "today"     },
  { label: "7 Dias",       shortLabel: "7d",      key: "7d"        },
  { label: "Ciclo Atual",  shortLabel: "Ciclo",   key: "cycle"     },
  { label: "Mês Anterior", shortLabel: "M-1",     key: "prevCycle" },
  { label: "3 Meses",      shortLabel: "3M",      key: "3m"        },
  { label: "6 Meses",      shortLabel: "6M",      key: "6m"        },
  { label: "9 Meses",      shortLabel: "9M",      key: "9m"        },
  { label: "Este Ano",     shortLabel: "Ano",     key: "year"      },
  { label: "Ano Passado",  shortLabel: "A-1",     key: "prevYear"  },
];

function formatLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeCycleDates(now: Date, cycleDay: number): { start: Date; end: Date } {
  let start = new Date(now.getFullYear(), now.getMonth(), cycleDay, 0, 0, 0);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, cycleDay - 1, 23, 59, 59, 999);
  if (now.getDate() < cycleDay) {
    start = new Date(now.getFullYear(), now.getMonth() - 1, cycleDay, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), cycleDay - 1, 23, 59, 59, 999);
  }
  return { start, end };
}

function getRangeForKey(key: string, cycleDay: number): { from: string; to: string } {
  const now = new Date();

  switch (key) {
    case "today": {
      const s = formatLocal(now);
      return { from: s, to: s };
    }
    case "7d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      return { from: formatLocal(s), to: formatLocal(now) };
    }
    case "cycle": {
      const { start, end } = computeCycleDates(now, cycleDay);
      return { from: formatLocal(start), to: formatLocal(end) };
    }
    case "prevCycle": {
      // one full cycle before the current cycle
      const { start: curStart } = computeCycleDates(now, cycleDay);
      const prevEnd = new Date(curStart.getTime() - 1); // 1ms before curStart
      const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth() - (cycleDay > 1 ? 0 : -1), cycleDay, 0, 0, 0);
      // Actually: prevStart = curStart minus 1 month
      const ps = new Date(curStart.getFullYear(), curStart.getMonth() - 1, cycleDay, 0, 0, 0);
      const pe = new Date(curStart.getTime() - 1000); // 1 second before curStart
      return { from: formatLocal(ps), to: formatLocal(pe) };
    }
    case "3m": {
      const s = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return { from: formatLocal(s), to: formatLocal(now) };
    }
    case "6m": {
      const s = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return { from: formatLocal(s), to: formatLocal(now) };
    }
    case "9m": {
      const s = new Date(now.getFullYear(), now.getMonth() - 9, now.getDate());
      return { from: formatLocal(s), to: formatLocal(now) };
    }
    case "year": {
      return {
        from: `${now.getFullYear()}-01-01`,
        to: `${now.getFullYear()}-12-31`,
      };
    }
    case "prevYear": {
      const y = now.getFullYear() - 1;
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    }
    default:
      return { from: formatLocal(now), to: formatLocal(now) };
  }
}

export function DashboardFilter({ cycleDay = 1, defaultFrom = "", defaultTo = "" }: DashboardFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fromParam = searchParams.get("from");
  const toParam   = searchParams.get("to");

  const [customFrom, setCustomFrom] = useState(fromParam || defaultFrom);
  const [customTo,   setCustomTo]   = useState(toParam   || defaultTo);
  const [expanded,   setExpanded]   = useState(false);

  useEffect(() => {
    setCustomFrom(fromParam || defaultFrom);
    setCustomTo(toParam || defaultTo);
  }, [fromParam, toParam, defaultFrom, defaultTo]);

  const hasActiveFilters = !!fromParam || !!toParam;

  // Detect which quick filter is active
  const activeKey = (() => {
    if (!fromParam && !toParam) return "cycle";
    for (const qf of QUICK_FILTERS) {
      const range = getRangeForKey(qf.key, cycleDay);
      if (range.from === fromParam && range.to === toParam) return qf.key;
    }
    return "custom";
  })();

  const applyRange = (from: string, to: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from);
    params.set("to", to);
    params.delete("osPage");
    router.push(`?${params.toString()}`);
  };

  const handleQuickFilter = (key: string) => {
    if (key === "cycle") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("from");
      params.delete("to");
      params.delete("osPage");
      router.push(`?${params.toString()}`);
      return;
    }
    const range = getRangeForKey(key, cycleDay);
    applyRange(range.from, range.to);
  };

  const handleCustomFilter = () => {
    if (customFrom && customTo) applyRange(customFrom, customTo);
  };

  const handleClearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    params.delete("osPage");
    router.push(`?${params.toString()}`);
  };

  const formatDisplayDate = (d: string) => {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-1 duration-400">
      {/* ── Main filter bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">

        {/* Top row: quick chips + active indicator + expand */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          {/* Scrollable chips */}
          <div
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto flex-1 scrollbar-hide pb-0.5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {QUICK_FILTERS.map((qf) => {
              const isActive = activeKey === qf.key;
              return (
                <button
                  key={qf.key}
                  onClick={() => handleQuickFilter(qf.key)}
                  className={`shrink-0 h-7 px-3 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap border ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25"
                      : "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="hidden sm:inline">{qf.label}</span>
                  <span className="sm:hidden">{qf.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Active period badge + expand toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {hasActiveFilters && activeKey === "custom" && (
              <span className="hidden md:flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20">
                <CalendarDays className="w-3 h-3" />
                {formatDisplayDate(fromParam || "")} → {formatDisplayDate(toParam || "")}
              </span>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                expanded
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Personalizar</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilter}
                title="Limpar filtro"
                className="flex items-center justify-center h-7 w-7 rounded-full border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable custom date row */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
              Período
            </span>
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg [color-scheme:light] dark:[color-scheme:dark] w-[130px]"
              />
              <span className="text-zinc-300 dark:text-zinc-600 text-xs font-medium">→</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg [color-scheme:light] dark:[color-scheme:dark] w-[130px]"
              />
              <Button
                size="sm"
                onClick={handleCustomFilter}
                className="h-8 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 gap-1.5 px-3"
              >
                <SlidersHorizontal className="w-3 h-3" />
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
