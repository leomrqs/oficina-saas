// app/dashboard/os/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClientOSManager } from "./ClientOSManager";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

export default async function OSPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId }
  });

  const orders = await prisma.order.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      customer: true,
      vehicle: true,
      items: true,
      mechanics: { include: { employee: true } } // Traz os mecânicos para o PDF
    },
    orderBy: { createdAt: 'desc' }
  });

  const customers = await prisma.customer.findMany({
    where: { tenantId: session.user.tenantId },
    include: { vehicles: true },
    orderBy: { name: 'asc' }
  });

  const products = await prisma.product.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: 'asc' }
  });

  // BUSCAMOS A EQUIPE ATIVA PARA APARECER NO SELECT DA OS
  const employees = await prisma.employee.findMany({
    where: { tenantId: session.user.tenantId, isActive: true },
    orderBy: { name: 'asc' }
  });

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="h-8 w-8" /> Orçamentos e OS
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">Gere orçamentos, vistorias, atrele mecânicos e imprima PDFs.</p>
        </div>
      </div>

      <ClientOSManager 
        initialOrders={orders} 
        customers={customers} 
        products={products} 
        tenant={tenant} 
        employees={employees} 
      />
    </>
  );
}