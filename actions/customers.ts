// actions/customers.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createCustomer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.customer.create({
    data: {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      document: formData.get("document") as string,
      email: formData.get("email") as string,
      cep: formData.get("cep") as string,
      street: formData.get("street") as string,
      number: formData.get("number") as string,
      complement: formData.get("complement") as string,
      neighborhood: formData.get("neighborhood") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      notes: formData.get("notes") as string,
      tenantId: session.user.tenantId,
    },
  });
  revalidatePath("/dashboard/clientes");
}

export async function updateCustomer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const id = formData.get("id") as string;

  await prisma.customer.update({
    where: { id, tenantId: session.user.tenantId },
    data: {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      document: formData.get("document") as string,
      email: formData.get("email") as string,
      cep: formData.get("cep") as string,
      street: formData.get("street") as string,
      number: formData.get("number") as string,
      complement: formData.get("complement") as string,
      neighborhood: formData.get("neighborhood") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      notes: formData.get("notes") as string,
    },
  });
  revalidatePath("/dashboard/clientes");
}

export async function deleteCustomer(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.customer.delete({
    where: { id, tenantId: session.user.tenantId },
  });
  revalidatePath("/dashboard/clientes");
}

export async function createVehicle(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const yearStr = formData.get("year") as string;

  await prisma.vehicle.create({
    data: {
      plate: (formData.get("plate") as string).toUpperCase(),
      brand: formData.get("brand") as string,
      model: formData.get("model") as string,
      year: yearStr ? parseInt(yearStr) : null,
      customerId: formData.get("customerId") as string,
      tenantId: session.user.tenantId,
    },
  });
  revalidatePath("/dashboard/clientes");
}

export async function deleteVehicle(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.vehicle.delete({
    where: { id, tenantId: session.user.tenantId },
  });
  revalidatePath("/dashboard/clientes");
}