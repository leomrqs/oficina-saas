// app/dashboard/agendamentos/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
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
      order: { select: { number: true, status: true } }
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

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 dark:text-white">
            <CalendarDays className="h-8 w-8 text-zinc-900 dark:text-zinc-100" /> Agenda da Oficina
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">Controle de clientes agendados e geração rápida de Ordem de Serviço.</p>
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