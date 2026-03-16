// app/dashboard/equipe/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HardHat } from "lucide-react";
import { ClientEmployeeManager } from "./ClientEmployeeManager";

export default async function EquipePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const employees = await prisma.employee.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      orderMechanics: {
        include: { order: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <HardHat className="h-8 w-8" /> Gestão de Equipe
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">Cadastre mecânicos e funcionários para designar funções nas OS.</p>
        </div>
      </div>

      <ClientEmployeeManager initialData={employees} />
    </>
  );
}