// app/dashboard/agendamentos/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CalendarDays, LayoutDashboard, FileText, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { ClientAppointmentManager } from "./ClientAppointmentManager";

export default async function AgendamentosPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }
  const tenantId = session.user.tenantId;

  // Puxamos agendamentos de 30 dias atrás até 60 dias no futuro para não pesar a memória
  const now = new Date();
  const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: { 
      tenantId,
      date: { gte: pastDate, lte: futureDate }
    },
    include: {
      customer: { select: { name: true, phone: true } },
      vehicle: { select: { plate: true, brand: true, model: true } },
      order: { select: { id: true, number: true, status: true } }
    },
    orderBy: [
      { date: 'asc' },
      { time: 'asc' }
    ]
  });

  const [customers, unlinkedOrders] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, vehicles: true },
      orderBy: { name: 'asc' }
    }),
    // OS que ainda não têm agendamento vinculado
    prisma.order.findMany({
      where: { tenantId, appointment: { is: null } },
      select: {
        id: true,
        number: true,
        status: true,
        problem: true,
        customerId: true,
        customer: { select: { name: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalToday = appointments.filter(a => {
    const d = new Date(a.date).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return d === today && a.status !== "CANCELED";
  }).length;

  return (
    <>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-xl shadow-violet-600/40 dark:shadow-violet-600/25">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 text-lg leading-none select-none">📅</span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
              Agenda da Oficina
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
              Gerencie agendamentos e gere OS com agilidade.
              {totalToday > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                  · {totalToday} hoje
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 hover:shadow-lg hover:shadow-zinc-500/10">
              <LayoutDashboard className="w-3.5 h-3.5" /> Painel
            </button>
          </Link>
          <Link href="/dashboard/patio">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600/50 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20">
              <LayoutGrid className="w-3.5 h-3.5" /> Pátio
            </button>
          </Link>
          <Link href="/dashboard/os">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-600/50 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20">
              <FileText className="w-3.5 h-3.5" /> OS
            </button>
          </Link>
        </div>
      </div>

      <ClientAppointmentManager
        appointments={appointments}
        customers={customers}
        unlinkedOrders={unlinkedOrders}
      />
    </>
  );
}