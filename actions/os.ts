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
      
      // Vistoria e Operacional
      mileage: data.mileage,
      fuelLevel: data.fuelLevel,
      deliveryDate: data.deliveryDate ? new Date(`${data.deliveryDate}T12:00:00Z`) : null,
      problem: data.problem,
      notes: data.notes,
      customerNotes: data.customerNotes,
      warrantyText: data.warrantyText,
      
      laborTotal: data.laborTotal,
      partsTotal: data.partsTotal,
      discount: data.discount,
      total: data.total,
      status: "PENDING",
      tenantId: session.user.tenantId,
      
      // Itens (Peças e Serviços)
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
      // Equipe (Funcionários Linkados)
      mechanics: {
        create: data.mechanics.map((mech: any) => ({
          employeeId: mech.employeeId,
          task: mech.task
        }))
      }
    },
  });

  revalidatePath("/dashboard/os");
  return order.id;
}

export async function updateOrderStatus(orderId: string, newStatus: "PENDING" | "APPROVED" | "WAITING_PARTS" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELED", paymentMethod?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  // IMPORTANTE: Agora incluímos os "items" para saber quais peças movimentar
  const order = await prisma.order.findUnique({ 
    where: { id: orderId },
    include: { items: true } 
  });
  if (!order) throw new Error("OS não encontrada");

  // Trava de segurança para saber se já tinha dado baixa antes
  const wasAlreadyCompleted = order.status === "COMPLETED";

  await prisma.$transaction(async (tx) => {
    // 1. Atualiza o status da OS
    await tx.order.update({
      where: { id: orderId, tenantId: session.user.tenantId },
      data: { status: newStatus },
    });

    // 2. SE ESTIVER FINALIZANDO A OS
    if (newStatus === "COMPLETED") {
      // 2A. Geração do Financeiro
      const existingTx = await tx.financialTransaction.findFirst({
        where: { orderId: orderId, tenantId: session.user.tenantId }
      });
      if (!existingTx) {
        await tx.financialTransaction.create({
          data: {
            title: `OS #${order.number} - ${paymentMethod || "Pagamento"}`,
            type: "INCOME",
            category: "Serviços Realizados",
            amount: order.total,
            status: "PAID",
            paymentMethod: paymentMethod || "Não informado",
            dueDate: new Date(),
            paymentDate: new Date(),
            orderId: order.id,
            tenantId: session.user.tenantId,
          }
        });
      }

      // 2B. BAIXA DE ESTOQUE AUTOMÁTICA
      if (!wasAlreadyCompleted) {
        for (const item of order.items) {
          // Só mexe no estoque se for Peça (não mão de obra) e tiver Produto ID
          if (!item.isLabor && item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
            
            // Registra a saída no histórico do estoque
            await tx.inventoryTransaction.create({
              data: {
                type: "OUT",
                quantity: item.quantity,
                reason: `Baixa automática - OS #${order.number}`,
                productId: item.productId,
                tenantId: session.user.tenantId,
              }
            });
          }
        }
      }
    } 
    // 3. SE ESTIVER DESFAZENDO (Ex: Era Completed e voltou para Cancelado ou Em Serviço)
    else {
      // Remove a transação financeira
      await tx.financialTransaction.deleteMany({
        where: { orderId: orderId, tenantId: session.user.tenantId }
      });

      // Estorna o estoque de volta para a prateleira
      if (wasAlreadyCompleted) {
        for (const item of order.items) {
          if (!item.isLabor && item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
            
            await tx.inventoryTransaction.create({
              data: {
                type: "IN",
                quantity: item.quantity,
                reason: `Estorno - OS #${order.number} (Reaberta/Cancelada)`,
                productId: item.productId,
                tenantId: session.user.tenantId,
              }
            });
          }
        }
      }
    }
  });

  // Limpa o cache das telas para atualizar tudo em tempo real!
  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/estoque");
}

export async function deleteOrder(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.order.delete({
    where: { id: orderId, tenantId: session.user.tenantId },
  });
  revalidatePath("/dashboard/os");
}

export async function updateOrderDetails(orderId: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  // Usamos uma "Transação" para garantir que, se der erro no meio, ele desfaz tudo e não quebra a OS
  await prisma.$transaction(async (tx) => {
    // 1. Limpa os itens e mecânicos antigos desta OS
    await tx.orderItem.deleteMany({ where: { orderId, tenantId: session.user.tenantId } });
    await tx.orderMechanic.deleteMany({ where: { orderId, employee: { tenantId: session.user.tenantId } } });

    // 2. Atualiza os dados principais e recria os itens novos
    await tx.order.update({
      where: { id: orderId, tenantId: session.user.tenantId },
      data: {
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        mileage: data.mileage,
        fuelLevel: data.fuelLevel,
        deliveryDate: data.deliveryDate ? new Date(`${data.deliveryDate}T12:00:00Z`) : null,
        problem: data.problem,
        notes: data.notes,
        customerNotes: data.customerNotes,
        warrantyText: data.warrantyText,
        laborTotal: data.laborTotal,
        partsTotal: data.partsTotal,
        discount: data.discount,
        total: data.total,
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
        mechanics: data.mechanics && data.mechanics.length > 0 ? {
          create: data.mechanics.map((mech: any) => ({
            employeeId: mech.employeeId,
            task: mech.task
          }))
        } : undefined
      },
    });
  });

  revalidatePath("/dashboard/os");
}