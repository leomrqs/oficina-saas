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

  // Busca todos os produtos da oficina e seu histórico completo
  const products = await prisma.product.findMany({
    where: {
      tenantId: session.user.tenantId,
    },
    include: {
      transactions: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Puxa as últimas 10 transações de cada produto por performance
      },
    },
    orderBy: {
      name: 'asc',
    }
  });

  // Cálculo de KPIs Rápidos
  const totalItems = products.length;
  const criticalItems = products.filter(p => p.stock <= p.minStock).length;
  const totalCapital = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-zinc-900" /> Estoque de Peças
          </h2>
          <p className="text-zinc-500">Gestão de inventário, auditoria e controle financeiro de mercadorias.</p>
        </div>
      </div>

      {/* MINI DASHBOARD DE ESTOQUE */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-zinc-50 border rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total de Peças Únicas</p>
          <p className="text-2xl font-bold text-zinc-900">{totalItems}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-sm">
          <p className="text-sm font-medium text-red-600">Itens em Alerta / Faltantes</p>
          <p className="text-2xl font-bold text-red-600">{criticalItems}</p>
        </div>
        <div className="bg-zinc-900 text-white rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-sm">
          <p className="text-sm font-medium text-zinc-400">Capital Imobilizado (Custo)</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCapital)}
          </p>
        </div>
      </div>

      <ClientInventory products={products} />
    </>
  );
}