// app/dashboard/oficinas/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTenantDetail, getTenantNotes, getPaymentHistory } from "@/actions/saas";
import { ClientTenantDetail } from "./ClientTenantDetail";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard");

  const { id } = await params;
  const [tenant, notes, payments] = await Promise.all([
    getTenantDetail(id),
    getTenantNotes(id),
    getPaymentHistory(id),
  ]);

  return <ClientTenantDetail tenant={tenant} notes={notes} payments={payments} />;
}
