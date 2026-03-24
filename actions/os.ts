// actions/os.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ============================================================================
// 🧠 MOTOR DE SINCRONIZAÇÃO FINANCEIRA 
// Garante que o Caixa reflita a realidade exata da OS (Orçamentos não entram)
// ============================================================================
async function syncFinance(tx: any, order: any, tenantId: string, paymentMethodFinal?: string) {
  // REGRA DE OURO: Orçamento (PENDING) e Cancelada (CANCELED) NÃO geram financeiro.
  if (order.status === "PENDING" || order.status === "CANCELED") {
    await tx.financialTransaction.deleteMany({
      where: { orderId: order.id, tenantId }
    });
    return; // Para a execução aqui.
  }

  const isCompleted = order.status === "COMPLETED";

  // 1. Sincroniza o SINAL (Adiantamento)
  if (order.advancePayment > 0) {
    const advanceTx = await tx.financialTransaction.findFirst({
      where: { orderId: order.id, tenantId, category: "Adiantamentos" }
    });

    if (advanceTx) {
      await tx.financialTransaction.update({
        where: { id: advanceTx.id },
        data: { amount: order.advancePayment }
      });
    } else {
      await tx.financialTransaction.create({
        data: {
          title: `OS #${order.number} - Sinal Recebido`, 
          type: "INCOME", 
          category: "Adiantamentos", 
          amount: order.advancePayment, 
          status: "PAID", 
          paymentMethod: "Dinheiro / PIX", 
          dueDate: order.createdAt || new Date(), 
          paymentDate: new Date(), 
          orderId: order.id, 
          tenantId,
          notes: "Sinal abatido do valor total da OS."
        }
      });
    }
  } else {
    // Se o usuário remover o sinal na edição da OS, exclui o registro do caixa
    await tx.financialTransaction.deleteMany({
      where: { orderId: order.id, tenantId, category: "Adiantamentos" }
    });
  }

  // 2. Sincroniza o SALDO RESTANTE (A Receber / Pagamento Final)
  const remainingBalance = order.total - (order.advancePayment || 0);
  
  if (remainingBalance > 0) {
    const remainingTx = await tx.financialTransaction.findFirst({
      where: { orderId: order.id, tenantId, category: "Serviços Realizados" }
    });

    const titleText = isCompleted ? `OS #${order.number} - Pagamento Final` : `OS #${order.number} - Restante a Pagar`;
    const notesText = `Valor Total: R$ ${order.total.toFixed(2)} | Sinal Pago: R$ ${(order.advancePayment || 0).toFixed(2)} | Falta Pagar: R$ ${remainingBalance.toFixed(2)}`;

    if (remainingTx) {
      await tx.financialTransaction.update({
        where: { id: remainingTx.id },
        data: { 
          title: titleText,
          notes: notesText,
          amount: remainingBalance, 
          status: isCompleted ? "PAID" : "PENDING",
          paymentMethod: isCompleted ? (paymentMethodFinal || remainingTx.paymentMethod || "Não Informado") : remainingTx.paymentMethod,
          paymentDate: isCompleted ? (remainingTx.paymentDate || new Date()) : null,
          dueDate: isCompleted ? new Date() : (order.deliveryDate || remainingTx.dueDate || new Date())
        }
      });
    } else {
      await tx.financialTransaction.create({
        data: {
          title: titleText, 
          notes: notesText,
          type: "INCOME", 
          category: "Serviços Realizados", 
          amount: remainingBalance, 
          status: isCompleted ? "PAID" : "PENDING", 
          paymentMethod: isCompleted ? (paymentMethodFinal || "Não Informado") : null, 
          dueDate: isCompleted ? new Date() : (order.deliveryDate || new Date()), 
          paymentDate: isCompleted ? new Date() : null, 
          orderId: order.id, 
          tenantId
        }
      });
    }
  } else {
    // Se o adiantamento cobriu tudo, remove cobranças pendentes
    await tx.financialTransaction.deleteMany({
      where: { orderId: order.id, tenantId, category: "Serviços Realizados" }
    });
  }
}
// ============================================================================

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
      advancePayment: data.advancePayment || 0.0,
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

  // Roda sincronizador (Neste caso, não fará nada no financeiro pois é PENDING, mas garante o padrão)
  await prisma.$transaction(async (tx) => {
    await syncFinance(tx, order, session.user.tenantId);
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
    // 1. Atualiza status da OS
    const updatedOrder = await tx.order.update({
      where: { id: orderId, tenantId: session.user.tenantId },
      data: { status: newStatus },
    });

    // 2. Cria log de auditoria da OS
    let logNote = "Status atualizado manualmente.";
    if (newStatus === "COMPLETED") logNote = "Finalizada. Receita lançada no Caixa e Peças baixadas do Estoque.";
    if (newStatus === "CANCELED") logNote = "OS Cancelada. Lançamentos financeiros revertidos.";
    if (newStatus === "APPROVED") logNote = "Orçamento aprovado. Provisões lançadas no financeiro.";

    await tx.orderHistory.create({
      data: {
        oldStatus: order.status,
        newStatus: newStatus,
        notes: logNote,
        orderId: order.id,
        tenantId: session.user.tenantId,
      }
    });

    // 3. Controle de Estoque Automatizado
    if (newStatus === "COMPLETED" && !wasAlreadyCompleted) {
      for (const item of order.items) {
        if (!item.isLabor && item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
          await tx.inventoryTransaction.create({
            data: {
              type: "OUT", quantity: item.quantity, reason: `Baixa automática (OS #${order.number})`, productId: item.productId, orderId: order.id, tenantId: session.user.tenantId,
            }
          });
        }
      }
    } else if (wasAlreadyCompleted && newStatus !== "COMPLETED") {
      for (const item of order.items) {
        if (!item.isLabor && item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
          await tx.inventoryTransaction.create({
            data: {
              type: "IN", quantity: item.quantity, reason: `Estorno de Estoque (OS #${order.number} reaberta)`, productId: item.productId, orderId: order.id, tenantId: session.user.tenantId,
            }
          });
        }
      }
    }

    // 4. Aciona Motor Financeiro
    await syncFinance(tx, updatedOrder, session.user.tenantId, paymentMethod);
  });

  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/patio");
  revalidatePath("/dashboard/financeiro");
  revalidatePath("/dashboard/estoque");
}

export async function deleteOrder(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.$transaction(async (tx) => {
    // Apaga os registros financeiros primeiro para evitar sujeira no caixa
    await tx.financialTransaction.deleteMany({
      where: { orderId: orderId, tenantId: session.user.tenantId }
    });
    
    // Apaga a Ordem de Serviço
    await tx.order.delete({
      where: { id: orderId, tenantId: session.user.tenantId },
    });
  });

  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/patio");
  revalidatePath("/dashboard/financeiro");
}

export async function updateOrderDetails(orderId: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  
  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId, tenantId: session.user.tenantId } });
    await tx.orderMechanic.deleteMany({ where: { orderId, employee: { tenantId: session.user.tenantId } } });

    const updatedOrder = await tx.order.update({
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
        advancePayment: data.advancePayment || 0.0,
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
        newStatus: order?.status || "PENDING",
        notes: "Detalhes da OS (Valores/Peças/Adiantamento) atualizados.",
        orderId: orderId,
        tenantId: session.user.tenantId,
      }
    });

    // 4. Aciona Motor Financeiro com os novos totais calculados
    await syncFinance(tx, updatedOrder, session.user.tenantId);
  });

  revalidatePath("/dashboard/os");
  revalidatePath("/dashboard/patio");
  revalidatePath("/dashboard/financeiro");
}