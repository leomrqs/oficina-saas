// app/dashboard/estoque/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientInventory } from "./ClientInventory";
import { Package } from "lucide-react";

export default async function EstoquePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const products = await prisma.product.findMany({
    where: {
      tenantId: session.user.tenantId,
    },
    include: {
      transactions: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, 
      },
    },
    orderBy: {
      name: 'asc',
    }
  });

  const totalItems = products.length;
  const criticalItems = products.filter(p => p.stock <= p.minStock).length;
  const totalCapital = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 dark:text-white">
            <Package className="h-8 w-8 text-zinc-900 dark:text-zinc-100" /> Estoque de Peças
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">Gestão de inventário, auditoria e controle financeiro de mercadorias.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border dark:border-zinc-800 rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-sm">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total de Peças Únicas</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalItems}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-sm">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Itens em Alerta / Faltantes</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-500">{criticalItems}</p>
        </div>
        <div className="bg-zinc-900 dark:bg-zinc-950 text-white rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-sm border dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Capital Imobilizado (Custo)</p>
          <p className="text-2xl font-bold text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCapital)}
          </p>
        </div>
      </div>

      <ClientInventory products={products} />
    </>
  );
}