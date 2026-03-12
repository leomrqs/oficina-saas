// actions/os.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createOrder(data: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const order = await prisma.order.create({
    data: {
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      mileage: data.mileage,
      problem: data.problem,
      notes: data.notes,
      laborTotal: data.laborTotal,
      partsTotal: data.partsTotal,
      discount: data.discount,
      total: data.total,
      status: "PENDING",
      tenantId: session.user.tenantId,
      items: {
        create: data.items.map((item: any) => ({
          name: item.name,
          isLabor: item.isLabor,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          productId: item.productId || null,
          tenantId: session.user.tenantId,
        })),
      },
    },
  });

  revalidatePath("/dashboard/os");
  return order.id;
}

export async function updateOrderStatus(orderId: string, newStatus: "PENDING" | "APPROVED" | "COMPLETED" | "CANCELED") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("OS não encontrada");

  await prisma.$transaction(async (tx) => {
    // 1. Atualiza o status da OS
    await tx.order.update({
      where: { id: orderId, tenantId: session.user.tenantId },
      data: { status: newStatus },
    });

    // 2. INTEGRAÇÃO FINANCEIRA AUTOMÁTICA
    if (newStatus === "COMPLETED") {
      // Se finalizou, joga pro Caixa como Receita Paga
      const existingTx = await tx.financialTransaction.findFirst({
        where: { orderId: orderId, tenantId: session.user.tenantId }
      });
      
      if (!existingTx) {
        await tx.financialTransaction.create({
          data: {
            title: `Recebimento OS #${order.number}`,
            type: "INCOME",
            category: "Serviços Realizados",
            amount: order.total,
            status: "PAID",
            dueDate: new Date(),
            paymentDate: new Date(),
            orderId: order.id,
            tenantId: session.user.tenantId,
          }
        });
      }
    } else {
      // Se voltou pra orçamento ou cancelou, remove do Caixa (se existir)
      await tx.financialTransaction.deleteMany({
        where: { orderId: orderId, tenantId: session.user.tenantId }
      });
    }
  });

  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/financeiro");
}

export async function deleteOrder(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.order.delete({
    where: { id: orderId, tenantId: session.user.tenantId },
  });

  revalidatePath("/dashboard/os");
}