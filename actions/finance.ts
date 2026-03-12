// actions/finance.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createTransaction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const status = formData.get("status") as "PENDING" | "PAID";
  
  // Tratamento de datas do HTML Input
  const dueDateStr = formData.get("dueDate") as string;
  // O HTML manda 'YYYY-MM-DD', precisamos adicionar a hora para o Prisma aceitar (T12:00:00Z evita bugs de fuso horário)
  const dueDate = new Date(`${dueDateStr}T12:00:00Z`); 
  
  const paymentDate = status === "PAID" ? new Date() : null;
  const notes = formData.get("notes") as string;

  await prisma.financialTransaction.create({
    data: {
      title, type, category, amount, status, dueDate, paymentDate, notes,
      tenantId: session.user.tenantId,
    },
  });

  revalidatePath("/dashboard/financeiro");
}

export async function markAsPaid(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.financialTransaction.update({
    where: { id, tenantId: session.user.tenantId },
    data: { status: "PAID", paymentDate: new Date() },
  });

  revalidatePath("/dashboard/financeiro");
}

export async function deleteTransaction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.financialTransaction.delete({
    where: { id, tenantId: session.user.tenantId },
  });

  revalidatePath("/dashboard/financeiro");
}