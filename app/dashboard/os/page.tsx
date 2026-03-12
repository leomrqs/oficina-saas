// app/dashboard/os/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { ClientOSManager } from "./ClientOSManager";

export default async function OSPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  // Busca todas as OS com relacionamentos aninhados
  const orders = await prisma.order.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      customer: true,
      vehicle: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  // Busca Clientes com seus veículos (Para o seletor)
  const customers = await prisma.customer.findMany({
    where: { tenantId: session.user.tenantId },
    include: { vehicles: true },
    orderBy: { name: 'asc' }
  });

  // Busca Estoque (Para o seletor de peças)
  const products = await prisma.product.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: 'asc' }
  });

  // KPIs
  const osAbertas = orders.filter(o => o.status === "PENDING").length;
  const osExecucao = orders.filter(o => o.status === "APPROVED").length;
  const faturamentoEsperado = orders.filter(o => o.status !== "CANCELED").reduce((acc, curr) => acc + curr.total, 0);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-zinc-900" /> Orçamentos & O.S.
          </h2>
          <p className="text-zinc-500">Crie orçamentos, converta em ordens de serviço e envie pelo WhatsApp.</p>
        </div>
      </div>

      {/* DASHBOARD RÁPIDO DE OS */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-sm">
          <p className="text-sm font-medium text-yellow-800">Orçamentos Pendentes</p>
          <p className="text-2xl font-bold text-yellow-900">{osAbertas}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-sm">
          <p className="text-sm font-medium text-blue-800">Em Execução (Aprovados)</p>
          <p className="text-2xl font-bold text-blue-900">{osExecucao}</p>
        </div>
        <div className="bg-zinc-900 text-white rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-sm">
          <p className="text-sm font-medium text-zinc-400">Total Movimentado</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoEsperado)}
          </p>
        </div>
      </div>

      <ClientOSManager initialOrders={orders} customers={customers} products={products} />
    </>
  );
}