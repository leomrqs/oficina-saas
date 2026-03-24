// app/dashboard/financeiro/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DollarSign } from "lucide-react";
import { ClientFinanceManager } from "./ClientFinanceManager";

export default async function FinanceiroPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  // 1. Busca dados da oficina (Meta Mensal e Dia de Fechamento do Caixa)
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { monthlyGoal: true, billingCycleDay: true }
  });

  // 2. Busca todas as transações com os dados da OS e Cliente pendurados (Para o WhatsApp)
  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId },
    include: {
      order: {
        include: {
          customer: true,
          vehicle: true
        }
      }
    },
    orderBy: { dueDate: 'desc' }
  });

  // 3. Busca Contas Fixas (Aluguel, Luz, etc)
  const fixedExpenses = await prisma.fixedExpense.findMany({
    where: { tenantId },
    orderBy: { dueDay: 'asc' }
  });

  // 4. Busca os Funcionários que têm salário e dia de pagamento (Automação do RH)
  const employees = await prisma.employee.findMany({
    where: { 
      tenantId, 
      isActive: true, 
      salary: { not: null }, 
      payDay: { not: null } 
    },
    orderBy: { payDay: 'asc' }
  });

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 dark:text-white">
            <DollarSign className="h-8 w-8 text-zinc-900 dark:text-zinc-100" /> Gestão Financeira
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">DRE Automático, fluxo de caixa, folha de pagamento e inadimplência.</p>
        </div>
      </div>

      {/* Passamos todos os dados brutos para o Client fazer a mágica visual e os filtros */}
      <ClientFinanceManager 
        transactions={transactions} 
        fixedExpenses={fixedExpenses} 
        employees={employees}
        tenantConfig={tenant}
      />
    </>
  );
}