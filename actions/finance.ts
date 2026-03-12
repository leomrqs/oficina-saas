// actions/finance.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// --- TRANSAÇÕES COMUNS ---
export async function createTransaction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const status = formData.get("status") as "PENDING" | "PAID";
  
  const dueDateStr = formData.get("dueDate") as string;
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

// --- CONTAS FIXAS MENSAIS ---
export async function createFixedExpense(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.fixedExpense.create({
    data: {
      title: formData.get("title") as string,
      category: formData.get("category") as string,
      amount: parseFloat(formData.get("amount") as string),
      dueDay: parseInt(formData.get("dueDay") as string),
      tenantId: session.user.tenantId,
    }
  });
  revalidatePath("/dashboard/financeiro");
}

export async function deleteFixedExpense(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.fixedExpense.delete({
    where: { id, tenantId: session.user.tenantId },
  });
  revalidatePath("/dashboard/financeiro");
}

export async function generateMonthlyFixedExpenses() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const tenantId = session.user.tenantId;
  const fixedExpenses = await prisma.fixedExpense.findMany({ where: { tenantId } });
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let createdCount = 0;

  for (const exp of fixedExpenses) {
    // Ajusta o dia para não quebrar em Fevereiro (ex: dia 31 em mês de 28)
    const maxDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const clampedDay = Math.min(exp.dueDay, maxDaysInMonth);
    const dueDate = new Date(currentYear, currentMonth, clampedDay, 12, 0, 0);
    
    // Tag única para saber se já lançou essa conta neste mês/ano específico
    const tag = `FIXED_EXPENSE_${exp.id}_${currentMonth}_${currentYear}`;
    
    const exists = await prisma.financialTransaction.findFirst({
      where: { tenantId, notes: { contains: tag } }
    });

    if (!exists) {
      await prisma.financialTransaction.create({
        data: {
          title: `[Fixo] ${exp.title}`,
          type: "EXPENSE",
          category: exp.category,
          amount: exp.amount,
          status: "PENDING",
          dueDate: dueDate,
          notes: tag, // Salva a tag invisível aqui
          tenantId
        }
      });
      createdCount++;
    }
  }

  revalidatePath("/dashboard/financeiro");
  return createdCount;
}