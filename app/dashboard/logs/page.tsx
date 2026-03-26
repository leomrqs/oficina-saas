// app/dashboard/logs/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLogs } from "@/actions/saas";
import { ClientAuditLogViewer } from "./ClientAuditLogViewer";

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const data = await getAuditLogs(page, 30);

  return <ClientAuditLogViewer data={data} currentPage={page} />;
}
