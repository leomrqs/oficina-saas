// prisma/seed.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Limpando o banco para o novo setup...');
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);

  // 1. Cria a Oficina do seu Cliente
  const tenantCliente = await prisma.tenant.create({
    data: {
      name: 'Oficina do João (Cliente)',
      cnpj: '11.111.111/0001-11',
      users: {
        create: {
          name: 'João Mecânico (Dono)',
          email: 'dono@oficina.com', // LOGIN DO CLIENTE PARA AMANHÃ
          password: hashedPassword,
          role: 'MANAGER', // <-- Papel correto para a HUD de oficina
        },
      },
    },
  });

  // 2. Cria a SUA empresa (O SaaS) e o seu usuário Super Admin
  const tenantSaaS = await prisma.tenant.create({
    data: {
      name: 'SaaS Master',
      cnpj: '00.000.000/0001-00',
      users: {
        create: {
          name: 'Leo (Dono do SaaS)',
          email: 'admin@saas.com', // SEU LOGIN
          password: hashedPassword,
          role: 'SUPER_ADMIN', // <-- Seu papel
        },
      },
    },
  });

  console.log('✅ Seed finalizado!');
  console.log('--------------------------------------------------');
  console.log('👉 PARA APRESENTAR AMANHÃ (Visão Oficina):');
  console.log('Login: dono@oficina.com | Senha: 123456');
  console.log('--------------------------------------------------');
  console.log('👉 PARA SEU CONTROLE (Visão SaaS):');
  console.log('Login: admin@saas.com | Senha: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });