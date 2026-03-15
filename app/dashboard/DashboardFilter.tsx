// app/dashboard/DashboardFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Filter } from "lucide-react";

export function DashboardFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const [customFrom, setCustomFrom] = useState(fromParam || "");
  const [customTo, setCustomTo] = useState(toParam || "");

  // Atualiza os inputs se a URL mudar por fora
  useEffect(() => {
    if (fromParam) setCustomFrom(fromParam);
    if (toParam) setCustomTo(toParam);
  }, [fromParam, toParam]);

  const setDateRange = (daysBack: number, isMonth = false, isYear = false) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (isMonth) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (isYear) {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      startDate.setDate(now.getDate() - daysBack);
    }

    // Formata para YYYY-MM-DD
    const fromStr = startDate.toISOString().split('T')[0];
    const toStr = endDate.toISOString().split('T')[0];
    
    setCustomFrom(fromStr);
    setCustomTo(toStr);
    router.push(`?from=${fromStr}&to=${toStr}`);
  };

  const handleCustomFilter = () => {
    if (customFrom && customTo) {
      router.push(`?from=${customFrom}&to=${customTo}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between bg-white border border-zinc-200 rounded-lg p-2 shadow-sm mb-6 gap-3">
      {/* Botões Rápidos */}
      <div className="flex flex-wrap items-center gap-1 w-full lg:w-auto">
        <Button variant="ghost" size="sm" onClick={() => setDateRange(0)} className="text-zinc-600 hover:text-zinc-900">
          Hoje
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDateRange(7)} className="text-zinc-600 hover:text-zinc-900">
          Últimos 7 Dias
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDateRange(0, true)} className="text-zinc-600 hover:text-zinc-900">
          Este Mês
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDateRange(0, false, true)} className="text-zinc-600 hover:text-zinc-900">
          Este Ano
        </Button>
      </div>

      {/* Calendário Customizado */}
      <div className="flex items-center gap-2 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-zinc-200 pt-3 lg:pt-0 lg:pl-3">
        <CalendarIcon className="w-4 h-4 text-zinc-400 hidden sm:block" />
        <Input 
          type="date" 
          value={customFrom} 
          onChange={(e) => setCustomFrom(e.target.value)} 
          className="h-8 text-xs bg-zinc-50"
        />
        <span className="text-zinc-400 text-xs">até</span>
        <Input 
          type="date" 
          value={customTo} 
          onChange={(e) => setCustomTo(e.target.value)} 
          className="h-8 text-xs bg-zinc-50"
        />
        <Button size="sm" onClick={handleCustomFilter} className="h-8 bg-zinc-900 hover:bg-zinc-800 text-white">
          <Filter className="w-3 h-3 mr-1" /> Filtrar
        </Button>
      </div>
    </div>
  );
}