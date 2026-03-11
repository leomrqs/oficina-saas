// app/dashboard/clientes/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClientManager } from "./ClientManager";
import { redirect } from "next/navigation";

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  // Busca todos os clientes e embute os veículos junto (Nested Query do Prisma)
  // Filtrando apenas pelos clientes DAQUELA oficina específica (Multitenant Seguro)
  const customers = await prisma.customer.findMany({
    where: {
      tenantId: session.user.tenantId,
    },
    include: {
      vehicles: true, // Traz os carros atrelados ao cliente
    },
    orderBy: {
      createdAt: 'desc', // Mais recentes primeiro
    }
  });

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes & Veículos</h2>
          <p className="text-zinc-500">Gerencie a base de clientes e vincule seus veículos.</p>
        </div>
      </div>

      {/* Passa os dados do banco direto para a HUD interativa */}
      <ClientManager initialData={customers} />
    </>
  );
}