// actions/customers.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Converte string vazia para null (evita violação de unique em campos opcionais)
const opt = (v: FormDataEntryValue | null): string | null =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;

// Remove tudo que não for dígito (evita parênteses, traços, espaços no banco)
const cleanPhone = (v: FormDataEntryValue | null): string | null => {
  const digits = typeof v === "string" ? v.replace(/\D/g, "") : "";
  return digits || null;
};

export async function createCustomer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!name) throw new Error("O nome do cliente é obrigatório.");
  if (!phone) throw new Error("O WhatsApp/telefone do cliente é obrigatório.");

  await prisma.customer.create({
    data: {
      name,
      phone: cleanPhone(formData.get("phone")),
      document: opt(formData.get("document")),
      email: opt(formData.get("email")),
      cep: opt(formData.get("cep")),
      street: opt(formData.get("street")),
      number: opt(formData.get("number")),
      complement: opt(formData.get("complement")),
      neighborhood: opt(formData.get("neighborhood")),
      city: opt(formData.get("city")),
      state: opt(formData.get("state")),
      notes: opt(formData.get("notes")),
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
      name: (formData.get("name") as string)?.trim(),
      phone: cleanPhone(formData.get("phone")),
      document: opt(formData.get("document")),
      email: opt(formData.get("email")),
      cep: opt(formData.get("cep")),
      street: opt(formData.get("street")),
      number: opt(formData.get("number")),
      complement: opt(formData.get("complement")),
      neighborhood: opt(formData.get("neighborhood")),
      city: opt(formData.get("city")),
      state: opt(formData.get("state")),
      notes: opt(formData.get("notes")),
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
      version: formData.get("version") as string, // NOVO
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