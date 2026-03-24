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

  const tenantId = session.user.tenantId;

  // 1. Busca todos os Produtos (Peças Físicas) e Serviços (Mão de Obra)
  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' }
  });

  // 2. Busca o histórico de movimentação global do estoque (Kardex)
  // Inclui os dados da Peça e os dados da OS que causou a saída (Rastreabilidade)
  const transactions = await prisma.inventoryTransaction.findMany({
    where: { tenantId },
    include: {
      product: {
        select: { name: true, sku: true, isService: true }
      },
      order: {
        select: { 
          number: true, 
          customer: { select: { name: true } } 
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 500 // Limite de segurança para não explodir a memória do navegador
  });

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 dark:text-white">
            <Package className="h-8 w-8 text-zinc-900 dark:text-zinc-100" /> Estoque & Catálogo
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">Gestão de inventário físico, catálogo de mão de obra e auditoria de movimentações.</p>
        </div>
      </div>

      {/* Passa a bucha pro Front-end resolver e deixar tudo reativo! */}
      <ClientInventory products={products} transactions={transactions} />
    </>
  );
}