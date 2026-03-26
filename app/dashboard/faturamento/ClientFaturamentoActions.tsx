"use client";
// app/dashboard/faturamento/ClientFaturamentoActions.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { generateMonthlyPayments } from "@/actions/saas";
import { toast } from "sonner";

export function ClientFaturamentoActions() {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const result = await generateMonthlyPayments();
      toast.success(`Cobranças geradas: ${result.created} de ${result.total} oficinas.`);
    } catch {
      toast.error("Erro ao gerar cobranças.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button size="sm" onClick={handleGenerate} disabled={isGenerating} className="gap-2">
      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      Gerar Cobranças do Mês
    </Button>
  );
}
