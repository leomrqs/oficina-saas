// app/dashboard/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { Menu, Wrench, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle"; // IMPORTAÇÃO DO BOTÃO DARK MODE
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId;

  // ---------------------------------------------------------------------------
  // CÁLCULO DA META MENSAL PARA O WIDGET DA SIDEBAR
  // ---------------------------------------------------------------------------
  let revCurrent = 0;
  const targetGoal = 50000; // Meta do MVP

  if (tenantId) {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthIncome = await prisma.financialTransaction.aggregate({
      where: { tenantId, type: "INCOME", status: "PAID", paymentDate: { gte: startOfThisMonth } },
      _sum: { amount: true }
    });
    revCurrent = currentMonthIncome._sum.amount || 0;
  }

  const progressPercent = Math.min((revCurrent / targetGoal) * 100, 100);
  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Componente visual do Widget (Agora adaptado para Modo Escuro)
  const GoalWidget = () => (
    <div className="px-5 py-4 border-t border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500"/> Meta do Mês
        </span>
        <span className={`text-[11px] font-bold ${progressPercent >= 100 ? 'text-emerald-600 dark:text-emerald-500' : 'text-blue-600 dark:text-blue-500'}`}>
          {progressPercent.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full bg-zinc-200/80 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
        <span className="text-zinc-700 dark:text-zinc-300">{formatBRL(revCurrent)}</span>
        <span>{formatBRL(targetGoal)}</span>
      </div>
    </div>
  );

  return (
    // dark:bg-zinc-950 garante o fundo escuro quando ativo
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] dark:bg-zinc-950">
      
      {/* SIDEBAR DESKTOP FIXA NO ECRÃ (sticky top-0 h-screen) */}
      <div className="hidden border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 md:flex flex-col sticky top-0 h-screen overflow-hidden">
        
        {/* Cabeçalho / Logo (shrink-0 impede que encolha) */}
        <div className="flex h-14 items-center border-b border-zinc-200/60 dark:border-zinc-800 px-4 lg:h-[60px] lg:px-6 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <div className="bg-zinc-900 dark:bg-zinc-100 p-1.5 rounded-md">
              <Wrench className="h-4 w-4 text-white dark:text-zinc-900" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-100 tracking-tight">Oficina SaaS</span>
          </Link>
        </div>
        
        {/* Área de Navegação (Se houver muitos itens, apenas ela fará scroll) */}
        <div className="flex-1 overflow-y-auto py-4">
          <Sidebar role={session?.user?.role} />
        </div>

        {/* WIDGET E MENU DO USUÁRIO SEMPRE VISÍVEIS NO RODAPÉ */}
        <div className="mt-auto flex flex-col shrink-0">
          {tenantId && <GoalWidget />}
          <div className="border-t border-zinc-200/60 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-950 flex items-center justify-between gap-2">
            <div className="flex-1 overflow-hidden">
               <UserMenu user={session?.user as any} /> 
            </div>
            {/* O BOTÃO QUE ALTERNA O TEMA */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* COLUNA DO CONTEÚDO PRINCIPAL */}
      <div className="flex flex-col min-w-0">
        
        {/* HEADER MOBILE (Fixo no topo em ecrãs pequenos) */}
        <header className="flex h-14 items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10">
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center shrink-0 md:hidden h-10 w-10 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-950">
              <Menu className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            
            <SheetContent side="left" className="flex flex-col h-full p-0 w-72 dark:bg-zinc-950 border-r-zinc-800">
              <div className="p-4 border-b dark:border-zinc-800 shrink-0">
                <SheetTitle className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  <div className="bg-zinc-900 dark:bg-zinc-100 p-1.5 rounded-md">
                    <Wrench className="h-4 w-4 text-white dark:text-zinc-900" />
                  </div>
                  Oficina SaaS
                </SheetTitle>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <Sidebar role={session?.user?.role} />
              </div>

              <div className="mt-auto flex flex-col shrink-0">
                {tenantId && <GoalWidget />}
                <div className="border-t border-zinc-200/60 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950 flex items-center justify-between gap-2">
                  <div className="flex-1 overflow-hidden">
                    <UserMenu user={session?.user as any} />
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1" />
        </header>

        {/* ÁREA DE CONTEÚDO ROLÁVEL */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-zinc-50/30 dark:bg-zinc-950/50">
          {children}
        </main>
      </div>
    </div>
  );
}