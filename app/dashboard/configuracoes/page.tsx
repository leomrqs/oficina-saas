// app/dashboard/configuracoes/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { ClientSettings } from "./ClientSettings";

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId }
  });

  if (!tenant) {
    redirect("/login");
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Settings className="h-8 w-8" /> Minha Empresa
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Gerencie os dados da sua oficina. Estas informações aparecerão no cabeçalho dos orçamentos e recibos (PDF).
          </p>
        </div>
      </div>

      <ClientSettings tenant={tenant} />
    </>
  );
}