// app/dashboard/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { Menu, Wrench, Target, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getActiveAnnouncements } from "@/actions/saas";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const role = session.user.role; 

  let revCurrent = 0;
  let targetGoal = 50000; 
  let tenantName = "Oficina Parceira"; // Nome padrão caso algo falhe

  // Busca inteligente: Pegamos o nome da Oficina E a meta financeira numa só tacada
  if (tenantId) {
    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { monthlyGoal: true, name: true, isActive: true }
    });
    
    if (tenantData) {
      if (!tenantData.isActive && role !== "SUPER_ADMIN") {
        redirect("/login");
      }
      tenantName = tenantData.name;
      if (tenantData.monthlyGoal) targetGoal = tenantData.monthlyGoal;
    }

    if (role === "MANAGER") {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthIncome = await prisma.financialTransaction.aggregate({
        where: { tenantId, type: "INCOME", status: "PAID", paymentDate: { gte: startOfThisMonth } },
        _sum: { amount: true }
      });
      revCurrent = currentMonthIncome._sum.amount || 0;
    }
  }

  // Fetch active announcements for non-SUPER_ADMIN users
  let announcements: { id: string; title: string; body: string; type: string }[] = [];
  if (role !== "SUPER_ADMIN") {
    try {
      announcements = await getActiveAnnouncements();
    } catch {
      // Silently fail if table doesn't exist yet
    }
  }

  const progressPercent = Math.min((revCurrent / targetGoal) * 100, 100);

  const GoalWidget = () => (
    <div className="px-5 py-4 border-t border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500"/> Meta
        </span>
        <span className={`text-[10px] font-bold ${progressPercent >= 100 ? 'text-emerald-600 dark:text-emerald-500' : 'text-blue-600 dark:text-blue-500'}`}>
          {progressPercent.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-zinc-200/80 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] dark:bg-zinc-950">
      
      {/* SIDEBAR DESKTOP FIXA NO ECRÃ */}
      <div className="hidden border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 md:flex flex-col sticky top-0 h-screen overflow-hidden">
        
        {/* CABEÇALHO ANIMADO E ROBUSTO (DESKTOP) */}
        <div className="flex h-[72px] items-center border-b border-zinc-200/60 dark:border-zinc-800 px-5 shrink-0 bg-zinc-50/30 dark:bg-zinc-950/50">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold group w-full">
            
            {/* Ícone Animado */}
            <div className="relative flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md group-hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-105 shrink-0">
              <Wrench className="h-5 w-5 text-white group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            
            {/* Tipografia Premium */}
            <div className="flex flex-col overflow-hidden">
              <span className="text-lg font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                Mecaniq<span className="text-blue-600 dark:text-blue-500">Control</span>
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest truncate w-full" title={tenantName}>
                {tenantName}
              </span>
            </div>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <Sidebar role={role} />
        </div>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="mt-auto flex flex-col shrink-0">
          {tenantId && role === "MANAGER" && <GoalWidget />}
          
          <div className="border-t border-zinc-200/60 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-950 flex items-center justify-between gap-2">
            <div className="flex-1 overflow-hidden">
               <UserMenu user={session?.user as any} /> 
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* COLUNA DO CONTEÚDO PRINCIPAL */}
      <div className="flex flex-col min-w-0">
        
        {/* HEADER MOBILE */}
        <header className="flex h-14 items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10">
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center shrink-0 md:hidden h-10 w-10 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-950 transition-colors">
              <Menu className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            
            <SheetContent side="left" className="flex flex-col h-full p-0 w-[280px] dark:bg-zinc-950 border-r-zinc-800">
              
              {/* CABEÇALHO ANIMADO E ROBUSTO (MOBILE) */}
              <div className="p-5 border-b dark:border-zinc-800 shrink-0 bg-zinc-50/30 dark:bg-zinc-950/50">
                <SheetTitle className="flex items-center gap-3 font-semibold group">
                  <div className="relative flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md">
                    <Wrench className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-lg font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                      Mecaniq<span className="text-blue-600 dark:text-blue-500">Control</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest truncate w-full">
                      {tenantName}
                    </span>
                  </div>
                </SheetTitle>
              </div>
              
              <div className="flex-1 overflow-y-auto py-6">
                <Sidebar role={role} />
              </div>

              <div className="mt-auto flex flex-col shrink-0">
                {tenantId && role === "MANAGER" && <GoalWidget />}
                
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

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-zinc-50/30 dark:bg-zinc-950/50">
          {announcements.length > 0 && announcements.slice(0, 2).map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm ${
                a.type === "critical"
                  ? "bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
                  : a.type === "warning"
                  ? "bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-800 dark:text-yellow-400"
                  : "bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400"
              }`}
            >
              <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{a.title}:</span> {a.body}
              </div>
            </div>
          ))}
          {children}
        </main>
      </div>
    </div>
  );
}