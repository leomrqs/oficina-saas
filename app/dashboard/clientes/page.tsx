// app/dashboard/clientes/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClientManager } from "./ClientManager";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  // Busca todos os clientes, veículos e o HISTÓRICO DE OS
  const customers = await prisma.customer.findMany({
    where: {
      tenantId: session.user.tenantId,
    },
    include: {
      vehicles: true, 
      orders: {
        orderBy: { createdAt: 'desc' } // Traz a OS mais nova primeiro
      }
    },
    orderBy: {
      createdAt: 'desc', 
    }
  });

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Clientes & Veículos</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Gerencie a base de clientes, vincule veículos e acesse o histórico.</p>
        </div>
      </div>

      <ClientManager initialData={customers} />
    </>
  );
}