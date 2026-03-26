// app/dashboard/oficinas/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllTenants, autoBlockExpiredTenants } from "@/actions/saas";
import { ClientTenantManager } from "./ClientTenantManager";

export default async function OficinasPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Auto-bloqueia tenants expirados antes de listar
  await autoBlockExpiredTenants();

  const tenants = await getAllTenants();

  return <ClientTenantManager tenants={tenants} />;
}
