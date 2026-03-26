// app/dashboard/comunicados/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAnnouncements } from "@/actions/saas";
import { ClientAnnouncementManager } from "./ClientAnnouncementManager";

export default async function ComunicadosPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard");

  const announcements = await getAnnouncements();
  return <ClientAnnouncementManager announcements={announcements} />;
}
