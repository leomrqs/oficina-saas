// app/dashboard/financeiro/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";
import { ClientFinanceManager } from "./ClientFinanceManager";

export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  // Busca as transações
  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { dueDate: 'desc' }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Cálculos do Dashboard (Resumo Mestre)
  const currentBalance = transactions
    .filter(t => t.status === "PAID")
    .reduce((acc, t) => t.type === "INCOME" ? acc + t.amount : acc - t.amount, 0);

  const pendingIncome = transactions
    .filter(t => t.type === "INCOME" && t.status === "PENDING")
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingExpense = transactions
    .filter(t => t.type === "EXPENSE" && t.status === "PENDING")
    .reduce((acc, t) => acc + t.amount, 0);

  const latePayments = transactions
    .filter(t => t.status === "PENDING" && new Date(t.dueDate).getTime() < today.getTime())
    .reduce((acc, t) => acc + t.amount, 0);

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-zinc-900" /> Gestão Financeira
          </h2>
          <p className="text-zinc-500">Controle seu fluxo de caixa, contas a pagar, contas a receber e inadimplência.</p>
        </div>
      </div>

      {/* DASHBOARD FINANCEIRO (Cards Premium) */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        
        {/* CARD SALDO EM CAIXA */}
        <div className={`p-5 rounded-xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${currentBalance >= 0 ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-800' : 'bg-gradient-to-br from-red-900 to-red-800 border-red-800'}`}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Saldo Real (Em Caixa)</p>
            <DollarSign className="w-5 h-5 text-zinc-500" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{formatBRL(currentBalance)}</p>
          <p className="text-xs text-zinc-400 mt-2">Valores já liquidados (Receitas - Despesas)</p>
        </div>

        {/* CARD A RECEBER */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-emerald-800 uppercase tracking-wider">A Receber</p>
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-700 tracking-tight">{formatBRL(pendingIncome)}</p>
          <p className="text-xs text-emerald-600/80 mt-2">Dinheiro esperado na conta</p>
        </div>

        {/* CARD A PAGAR */}
        <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-orange-800 uppercase tracking-wider">A Pagar (Previsão)</p>
            <ArrowDownRight className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-black text-orange-700 tracking-tight">{formatBRL(pendingExpense)}</p>
          <p className="text-xs text-orange-600/80 mt-2">Contas pendentes (não vencidas e vencidas)</p>
        </div>

        {/* CARD INADIMPLÊNCIA / ATRASO */}
        <div className="bg-red-50/50 border border-red-100 p-5 rounded-xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-red-800 uppercase tracking-wider">Atrasos / Inadimplência</p>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-black text-red-600 tracking-tight">{formatBRL(latePayments)}</p>
          <p className="text-xs text-red-500/80 mt-2 font-medium">Contas ou clientes vencidos</p>
        </div>

      </div>

      {/* A HUD INTERATIVA EM BAIXO */}
      <ClientFinanceManager transactions={transactions} />
    </>
  );
}