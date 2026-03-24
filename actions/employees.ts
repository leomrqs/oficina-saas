// actions/employees.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createEmployee(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const salaryStr = formData.get("salary") as string;
  const payDayStr = formData.get("payDay") as string;

  await prisma.employee.create({
    data: {
      name: formData.get("name") as string,
      cpf: formData.get("cpf") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as string,
      salary: salaryStr ? parseFloat(salaryStr) : null,
      payDay: payDayStr ? parseInt(payDayStr) : null,
      isActive: true,
      tenantId: session.user.tenantId,
    }
  });

  revalidatePath("/dashboard/equipe");
  revalidatePath("/dashboard/os");
}

export async function updateEmployee(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const id = formData.get("id") as string;
  const salaryStr = formData.get("salary") as string;
  const payDayStr = formData.get("payDay") as string;

  await prisma.employee.update({
    where: { id, tenantId: session.user.tenantId },
    data: {
      name: formData.get("name") as string,
      cpf: formData.get("cpf") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as string,
      salary: salaryStr ? parseFloat(salaryStr) : null,
      payDay: payDayStr ? parseInt(payDayStr) : null,
    }
  });

  revalidatePath("/dashboard/equipe");
}

export async function toggleEmployeeStatus(id: string, currentStatus: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.employee.update({
    where: { id, tenantId: session.user.tenantId },
    data: { isActive: !currentStatus }
  });

  revalidatePath("/dashboard/equipe");
}

export async function deleteEmployee(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.employee.delete({
    where: { id, tenantId: session.user.tenantId }
  });

  revalidatePath("/dashboard/equipe");
}