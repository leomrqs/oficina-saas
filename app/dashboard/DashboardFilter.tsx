// app/dashboard/DashboardFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Filter, XCircle } from "lucide-react";

export function DashboardFilter({ cycleDay = 1, defaultFrom = "", defaultTo = "" }: { cycleDay?: number, defaultFrom?: string, defaultTo?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Inicializa os inputs com os parâmetros da URL, ou puxa o Ciclo Financeiro padrão do Servidor
  const [customFrom, setCustomFrom] = useState(fromParam || defaultFrom);
  const [customTo, setCustomTo] = useState(toParam || defaultTo);

  // Mantém os botões reativos
  useEffect(() => {
    setCustomFrom(fromParam || defaultFrom);
    setCustomTo(toParam || defaultTo);
  }, [fromParam, toParam, defaultFrom, defaultTo]);

  // Função blindada contra Fuso Horário (Resolve o escorregamento de dias)
  const formatLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const setDateRange = (daysBack: number, isMonth = false, isYear = false) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (isMonth) {
      // 🧠 LÓGICA DE CICLO FINANCEIRO: Mapeia do dia configurado até o dia anterior do próximo mês
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
      // Dias retroativos com segurança de fuso
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const fromStr = formatLocal(startDate);
    const toStr = formatLocal(endDate);
    
    setCustomFrom(fromStr);
    setCustomTo(toStr);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', fromStr);
    params.set('to', toStr);
    router.push(`?${params.toString()}`);
  };

  const handleCustomFilter = () => {
    if (customFrom && customTo) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('from', customFrom);
      params.set('to', customTo);
      router.push(`?${params.toString()}`);
    }
  };

  const handleClearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('from');
    params.delete('to');
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters = !!fromParam || !!toParam;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 shadow-sm mb-6 gap-3">
      {/* Botões Rápidos */}
      <div className="flex flex-wrap items-center gap-1 w-full lg:w-auto">
        <Button variant="ghost" size="sm" onClick={() => setDateRange(0)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 dark:hover:bg-zinc-800">
          Hoje
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDateRange(7)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 dark:hover:bg-zinc-800">
          Últimos 7 Dias
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDateRange(0, true)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 dark:hover:bg-zinc-800">
          Ciclo Atual (Mês)
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDateRange(0, false, true)} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 dark:hover:bg-zinc-800">
          Este Ano
        </Button>
      </div>

      {/* Calendário Customizado */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 pt-3 lg:pt-0 lg:pl-3">
        <CalendarIcon className="w-4 h-4 text-zinc-400 hidden sm:block shrink-0" />
        <Input 
          type="date" 
          value={customFrom} 
          onChange={(e) => setCustomFrom(e.target.value)} 
          className="h-9 sm:h-8 text-xs bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark] flex-1 sm:flex-none sm:w-[130px]"
        />
        <span className="text-zinc-400 dark:text-zinc-500 text-xs shrink-0">até</span>
        <Input 
          type="date" 
          value={customTo} 
          onChange={(e) => setCustomTo(e.target.value)} 
          className="h-9 sm:h-8 text-xs bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark] flex-1 sm:flex-none sm:w-[130px]"
        />
        <div className="flex gap-1 w-full sm:w-auto mt-2 sm:mt-0">
          <Button size="sm" onClick={handleCustomFilter} className="flex-1 sm:flex-none h-9 sm:h-8 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900">
            <Filter className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">Filtrar</span>
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" size="icon" onClick={handleClearFilter} className="h-9 sm:h-8 w-9 sm:w-8 shrink-0 text-red-500 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30" title="Limpar Filtros">
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}