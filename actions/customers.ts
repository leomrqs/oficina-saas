// actions/customers.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Tipagem básica para garantir segurança
export async function createCustomer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const document = formData.get("document") as string;

  await prisma.customer.create({
    data: {
      name,
      phone,
      document,
      tenantId: session.user.tenantId,
    },
  });

  // Manda o Next.js atualizar a tela de clientes em tempo real
  revalidatePath("/dashboard/clientes");
}

export async function createVehicle(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const customerId = formData.get("customerId") as string;
  const plate = formData.get("plate") as string;
  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const year = formData.get("year") ? parseInt(formData.get("year") as string) : null;

  await prisma.vehicle.create({
    data: {
      plate: plate.toUpperCase(), // Força placa maiúscula
      brand,
      model,
      year,
      customerId,
      tenantId: session.user.tenantId,
    },
  });

  revalidatePath("/dashboard/clientes");
}