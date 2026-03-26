// app/dashboard/DashboardFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, SlidersHorizontal, X } from "lucide-react";

export function DashboardFilter({ cycleDay = 1, defaultFrom = "", defaultTo = "" }: { cycleDay?: number, defaultFrom?: string, defaultTo?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const [customFrom, setCustomFrom] = useState(fromParam || defaultFrom);
  const [customTo, setCustomTo] = useState(toParam || defaultTo);

  useEffect(() => {
    setCustomFrom(fromParam || defaultFrom);
    setCustomTo(toParam || defaultTo);
  }, [fromParam, toParam, defaultFrom, defaultTo]);

  const formatLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const setDateRange = (daysBack: number, isMonth = false, isYear = false) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (isMonth) {
      startDate = new Date(now.getFullYear(), now.getMonth(), cycleDay, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, cycleDay - 1, 23, 59, 59, 999);
      if (now.getDate() < cycleDay) {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, cycleDay, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), cycleDay - 1, 23, 59, 59, 999);
      }
    } else if (isYear) {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const fromStr = formatLocal(startDate);
    const toStr = formatLocal(endDate);
    setCustomFrom(fromStr);
    setCustomTo(toStr);
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", fromStr);
    params.set("to", toStr);
    router.push(`?${params.toString()}`);
  };

  const handleCustomFilter = () => {
    if (customFrom && customTo) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", customFrom);
      params.set("to", customTo);
      router.push(`?${params.toString()}`);
    }
  };

  const handleClearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters = !!fromParam || !!toParam;

  const quickBtnClass =
    "h-8 px-3 text-xs font-medium rounded-lg transition-all duration-150 " +
    "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 " +
    "hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700";

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 shadow-sm mb-6 gap-3">

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mr-1 hidden sm:block">
          Rápido
        </span>
        <button onClick={() => setDateRange(0)} className={quickBtnClass}>Hoje</button>
        <button onClick={() => setDateRange(7)} className={quickBtnClass}>7 Dias</button>
        <button onClick={() => setDateRange(0, true)} className={`${quickBtnClass} ${!hasActiveFilters ? "!bg-blue-50 dark:!bg-blue-500/10 !text-blue-700 dark:!text-blue-400 !border-blue-200 dark:!border-blue-500/30" : ""}`}>
          Ciclo Atual
        </button>
        <button onClick={() => setDateRange(0, false, true)} className={quickBtnClass}>Este Ano</button>
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px h-6 bg-zinc-200 dark:bg-zinc-800 shrink-0" />
      <div className="lg:hidden h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Custom Date Range */}
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays className="w-4 h-4 text-zinc-400 dark:text-zinc-500 hidden sm:block shrink-0" />
        <Input
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg [color-scheme:light] dark:[color-scheme:dark] flex-1 sm:flex-none sm:w-[130px]"
        />
        <span className="text-zinc-300 dark:text-zinc-600 text-xs font-medium shrink-0">→</span>
        <Input
          type="date"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg [color-scheme:light] dark:[color-scheme:dark] flex-1 sm:flex-none sm:w-[130px]"
        />
        <div className="flex gap-1.5 w-full sm:w-auto mt-1 sm:mt-0">
          <Button
            size="sm"
            onClick={handleCustomFilter}
            className="flex-1 sm:flex-none h-8 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 gap-1.5"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden sm:inline">Filtrar</span>
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilter}
              className="h-8 w-8 rounded-lg shrink-0 text-red-500 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40"
              title="Limpar Filtros"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
