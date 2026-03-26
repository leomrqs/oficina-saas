// app/dashboard/faturamento/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DollarSign } from "lucide-react";
import { autoBlockExpiredTenants, autoEnsurePayments, autoEnsureExpensePayments } from "@/actions/saas";
import { ClientFaturamentoManager } from "./ClientFaturamentoManager";

export default async function FaturamentoSaasPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard");

  const tenantId = session.user.tenantId;

  // Auto-sync: bloqueia expirados + garante faturas de receita e despesa + marca atrasados
  await Promise.all([
    autoBlockExpiredTenants(),
    autoEnsurePayments(),
    autoEnsureExpensePayments(tenantId),
  ]);

  const noAdmin = { NOT: { users: { some: { role: "SUPER_ADMIN" as const } } } };

  const [payments, tenants, fixedExpenses, expensePayments, manualTransactions] = await Promise.all([
    prisma.saaSPayment.findMany({
      where: { tenant: noAdmin },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { tenant: { select: { name: true, saasPlan: true, isActive: true } } },
    }),
    prisma.tenant.findMany({
      where: noAdmin,
      orderBy: { saasDueDate: "asc" },
      select: {
        id: true, name: true, cnpj: true, isActive: true,
        saasPlan: true, saasPrice: true, saasDueDate: true,
      },
    }),
    prisma.fixedExpense.findMany({
      where: { tenantId },
      orderBy: { dueDay: "asc" },
    }),
    prisma.saaSExpensePayment.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        fixedExpense: { select: { title: true, category: true, dueDay: true } },
      },
    }),
    prisma.financialTransaction.findMany({
      where: { tenantId },
      orderBy: { dueDate: "desc" },
    }),
  ]);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 dark:text-white">
            <DollarSign className="h-8 w-8 text-zinc-900 dark:text-zinc-100" /> Faturamento SaaS
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">DRE do SaaS, cobranças mensais, custos fixos de operação.</p>
        </div>
      </div>
      <ClientFaturamentoManager
        payments={payments}
        tenants={tenants}
        fixedExpenses={fixedExpenses}
        expensePayments={expensePayments}
        manualTransactions={manualTransactions}
      />
    </>
  );
}
