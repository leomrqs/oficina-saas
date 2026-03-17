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
      fuelLevel: data.fuelLevel,
      deliveryDate: data.deliveryDate ? new Date(`${data.deliveryDate}T12:00:00Z`) : null,
      problem: data.problem,
      notes: data.notes,
      customerNotes: data.customerNotes,
      warrantyText: data.warrantyText,
      
      laborTotal: data.laborTotal,
      partsTotal: data.partsTotal,
      discount: data.discount,
      advancePayment: data.advancePayment || 0.0, // <-- Salvando Adiantamento
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
      mechanics: {
        create: data.mechanics.map((mech: any) => ({
          employeeId: mech.employeeId,
          task: mech.task
        }))
      },
      history: {
        create: {
          newStatus: "PENDING",
          notes: "Orçamento criado.",
          tenantId: session.user.tenantId
        }
      }
    },
  });

  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/patio");
  return order.id;
}

export async function updateOrderStatus(orderId: string, newStatus: "PENDING" | "APPROVED" | "WAITING_PARTS" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELED", paymentMethod?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const order = await prisma.order.findUnique({ 
    where: { id: orderId },
    include: { items: true } 
  });
  if (!order) throw new Error("OS não encontrada");

  const wasAlreadyCompleted = order.status === "COMPLETED";

  await prisma.$transaction(async (tx) => {
    // 1. Atualiza status
    await tx.order.update({
      where: { id: orderId, tenantId: session.user.tenantId },
      data: { status: newStatus },
    });

    // 2. CRIA LOG DE AUDITORIA
    let logNote = "Status atualizado manualmente.";
    if (newStatus === "COMPLETED") logNote = "Finalizada. Baixa automática de estoque.";
    if (newStatus === "CANCELED") logNote = "Orçamento cancelado/reprovado.";

    await tx.orderHistory.create({
      data: {
        oldStatus: order.status,
        newStatus: newStatus,
        notes: logNote,
        orderId: order.id,
        tenantId: session.user.tenantId,
      }
    });

    // 3. Financeiro e Estoque
    if (newStatus === "COMPLETED") {
      
      // Inteligência Financeira: Limpamos os registros financeiros antigos desta OS para recriar com precisão
      await tx.financialTransaction.deleteMany({
        where: { orderId: orderId, tenantId: session.user.tenantId }
      });

      // 3A. Se houver Adiantamento, lança ele separado no caixa
      if (order.advancePayment > 0) {
        await tx.financialTransaction.create({
          data: {
            title: `OS #${order.number} - Adiantamento (Sinal)`,
            type: "INCOME",
            category: "Serviços Realizados",
            amount: order.advancePayment,
            status: "PAID",
            paymentMethod: "PIX / Transferência", // Pode ser generalizado para o sinal
            dueDate: order.createdAt,
            paymentDate: order.createdAt,
            orderId: order.id,
            tenantId: session.user.tenantId,
          }
        });
      }

      // 3B. Calcula o Saldo Devedor (Total - Adiantamento)
      const remainingBalance = order.total - order.advancePayment;
      
      // Se ainda sobrar algo a pagar, lança o Pagamento Final
      if (remainingBalance > 0) {
        await tx.financialTransaction.create({
          data: {
            title: `OS #${order.number} - Pagamento Final`,
            type: "INCOME",
            category: "Serviços Realizados",
            amount: remainingBalance,
            status: "PAID",
            paymentMethod: paymentMethod || "Não informado",
            dueDate: new Date(),
            paymentDate: new Date(),
            orderId: order.id,
            tenantId: session.user.tenantId,
          }
        });
      }

      // 3C. Baixa de Estoque
      if (!wasAlreadyCompleted) {
        for (const item of order.items) {
          if (!item.isLabor && item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
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
    else {
      // Se for estornado, desfaz financeiro e estoque
      await tx.financialTransaction.deleteMany({
        where: { orderId: orderId, tenantId: session.user.tenantId }
      });

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

  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/patio");
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
  revalidatePath("/dashboard/patio");
}

export async function updateOrderDetails(orderId: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId, tenantId: session.user.tenantId } });
    await tx.orderMechanic.deleteMany({ where: { orderId, employee: { tenantId: session.user.tenantId } } });

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
        advancePayment: data.advancePayment || 0.0, // <-- Atualiza Adiantamento
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
    
    await tx.orderHistory.create({
      data: {
        newStatus: data.status || "PENDING",
        notes: "Detalhes da OS (Peças/Valores) atualizados manualmente.",
        orderId: orderId,
        tenantId: session.user.tenantId,
      }
    });
  });

  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/patio");
}