// actions/settings.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateTenantSettings(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const name = formData.get("name") as string;
  const cnpj = formData.get("cnpj") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const logoUrl = formData.get("logoUrl") as string;

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { name, cnpj, phone, address, logoUrl },
  });

  revalidatePath("/dashboard/configuracoes");
  revalidatePath("/dashboard"); 
}