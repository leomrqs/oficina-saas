// prisma/seed.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma'; // Agora ele usa nossa conexão certa!

async function main() {
  console.log('Iniciando o seed...');
  // ... resto do código continua igualzinho

  // Limpa o banco antes de criar (opcional, bom para testes)
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);

  // Cria a Oficina (Tenant) e o Usuário (Admin) de uma vez só usando Nested Writes do Prisma
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Oficina Central',
      cnpj: '00.000.000/0001-00',
      users: {
        create: {
          name: 'Administrador Mestre',
          email: 'admin@oficina.com',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
        },
      },
    },
    include: {
      users: true,
    },
  });

  console.log('✅ Seed finalizado com sucesso!');
  console.log('Oficina criada:', tenant.name);
  console.log('Usuário Admin:', tenant.users[0].email);
  console.log('Senha:', '123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });