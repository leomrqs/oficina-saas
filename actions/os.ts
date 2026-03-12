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
      status: "PENDING", // Nasce sempre como Orçamento
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

  // TODO: Quando status for COMPLETED, dar baixa no estoque dos itens (Faremos depois da apresentação)

  await prisma.order.update({
    where: { id: orderId, tenantId: session.user.tenantId },
    data: { status: newStatus },
  });

  revalidatePath("/dashboard/os");
}

export async function deleteOrder(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.order.delete({
    where: { id: orderId, tenantId: session.user.tenantId },
  });

  revalidatePath("/dashboard/os");
}