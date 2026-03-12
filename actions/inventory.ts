// actions/inventory.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createProduct(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category = formData.get("category") as string;
  const location = formData.get("location") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const costPrice = parseFloat(formData.get("costPrice") as string);
  const sellingPrice = parseFloat(formData.get("sellingPrice") as string);
  const minStock = parseInt(formData.get("minStock") as string);
  const initialStock = parseInt(formData.get("initialStock") as string);

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name, sku, category, location, imageUrl, costPrice, sellingPrice, minStock, stock: initialStock,
        tenantId: session.user.tenantId,
      },
    });

    if (initialStock > 0) {
      await tx.inventoryTransaction.create({
        data: {
          type: "IN", quantity: initialStock, reason: "Estoque Inicial",
          productId: product.id, tenantId: session.user.tenantId,
        },
      });
    }
  });

  revalidatePath("/dashboard/estoque");
}

export async function adjustStock(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const productId = formData.get("productId") as string;
  const type = formData.get("type") as "IN" | "OUT";
  const quantity = parseInt(formData.get("quantity") as string);
  const reason = formData.get("reason") as string;

  await prisma.$transaction(async (tx) => {
    await tx.inventoryTransaction.create({
      data: {
        productId, type, quantity, reason, tenantId: session.user.tenantId,
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        stock: type === "IN" ? { increment: quantity } : { decrement: quantity },
      },
    });
  });

  revalidatePath("/dashboard/estoque");
}

export async function updateProduct(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category = formData.get("category") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const costPrice = parseFloat(formData.get("costPrice") as string);
  const sellingPrice = parseFloat(formData.get("sellingPrice") as string);
  const minStock = parseInt(formData.get("minStock") as string);

  await prisma.$transaction(async (tx) => {
    // 1. Atualiza os dados da peça
    await tx.product.update({
      where: { id, tenantId: session.user.tenantId },
      data: { name, sku, category, imageUrl, costPrice, sellingPrice, minStock },
    });

    // 2. Registra no log do histórico (quantidade 0, pois é só edição de dados)
    await tx.inventoryTransaction.create({
      data: {
        type: "EDIT", 
        quantity: 0, 
        reason: "Atualização de dados cadastrais da peça",
        productId: id, 
        tenantId: session.user.tenantId,
      },
    });
  });

  revalidatePath("/dashboard/estoque");
}