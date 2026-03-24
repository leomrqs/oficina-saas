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
  const billingCycleDayStr = formData.get("billingCycleDay") as string;
  
  const billingCycleDay = billingCycleDayStr ? parseInt(billingCycleDayStr, 10) : 1;

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { name, cnpj, phone, address, logoUrl, billingCycleDay },
  });

  revalidatePath("/dashboard/configuracoes");
  revalidatePath("/dashboard"); 
  revalidatePath("/dashboard/financeiro"); // Garante que o financeiro saiba da mudança
}

export async function updateMonthlyGoal(goal: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { monthlyGoal: goal },
  });

  // O parâmetro "layout" força a barra lateral a recarregar imediatamente
  revalidatePath("/dashboard", "layout"); 
}