// app/dashboard/patio/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { KanbanBoard } from "./KanbanBoard";
import { LayoutGrid } from "lucide-react";

export default async function PatioPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const tenantId = session.user.tenantId;

  // 1. Busca os dados da Oficina
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  // 2. Busca todas as OS ativas (com itens e tudo mais para abrir no modal)
  const activeOrders = await prisma.order.findMany({
    where: { 
      tenantId,
      status: { notIn: ["CANCELED", "COMPLETED"] } 
    },
    include: {
      customer: true,
      vehicle: true,
      items: true,
      mechanics: { include: { employee: true } }
    },
    orderBy: { updatedAt: 'asc' } 
  });

  // 3. Busca os outros dados necessários para o modal de edição funcionar
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    include: { vehicles: true },
    orderBy: { name: 'asc' }
  });

  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' }
  });

  const employees = await prisma.employee.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <LayoutGrid className="h-8 w-8" /> Pátio Virtual
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">Gerencie o fluxo de veículos e edite as OS diretamente daqui.</p>
        </div>
      </div>
      
      {/* Container flex-1 para preencher a tela e não quebrar o layout */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard 
          initialOrders={activeOrders} 
          customers={customers}
          products={products}
          tenant={tenant}
          employees={employees}
        />
      </div>
    </div>
  );
}