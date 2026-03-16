// actions/profile.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function changePassword(currentPass: string, newPass: string) {
  // 1. Verifica se o usuário está logado
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Não autorizado. Faça login novamente.");
  }

  // 2. Busca o usuário no banco de dados
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  // 3. Verifica se a senha atual digitada está correta
  const isValid = await bcrypt.compare(currentPass, user.password);
  if (!isValid) {
    throw new Error("A senha atual está incorreta.");
  }

  // 4. Criptografa a senha nova
  const hashedNewPassword = await bcrypt.hash(newPass, 10);

  // 5. Salva a nova senha no banco
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword }
  });

  return true;
}