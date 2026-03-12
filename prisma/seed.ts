// prisma/seed.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma'; // Importando a conexão certa!

async function main() {
  console.log('🌱 Iniciando a semeadura massiva para a apresentação...');

  const tenantId = 'cmmmrvbkk00007gllmv6eh7er';
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 1. GARANTE QUE O TENANT (OFICINA) E O SUPER ADMIN EXISTAM SEM DUPLICAR
  const tenantCliente = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'Oficina do João (Cliente)',
      cnpj: '11.111.111/0001-11',
      users: {
        create: {
          name: 'João Mecânico (Dono)',
          email: 'dono@oficina.com',
          password: hashedPassword,
          role: 'MANAGER',
        },
      },
    },
  });

  // Garante seu acesso como Admin SaaS também
  await prisma.tenant.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'SaaS Master',
      cnpj: '00.000.000/0001-00',
      users: {
        create: {
          name: 'Leo (Dono do SaaS)',
          email: 'admin@saas.com',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
        },
      },
    },
  });

  // LIMPA DADOS ANTIGOS DA OFICINA PARA EVITAR DUPLICIDADE AO RODAR VÁRIAS VEZES
  console.log('🧹 Limpando dados antigos de clientes e estoque...');
  await prisma.inventoryTransaction.deleteMany({ where: { tenantId } });
  await prisma.vehicle.deleteMany({ where: { tenantId } });
  await prisma.product.deleteMany({ where: { tenantId } });
  await prisma.customer.deleteMany({ where: { tenantId } });

  // 2. INSERINDO PRODUTOS (ESTOQUE) COM TRANSAÇÕES INICIAIS
  console.log('📦 Semeando Estoque de Peças...');
  const produtosMocados = [
    { name: 'Silencioso Traseiro Gol G5/G6', sku: 'SIL-VW-001', category: 'Escapamentos', costPrice: 120.50, sellingPrice: 280.00, stock: 12, minStock: 3, location: 'Prateleira A1' },
    { name: 'Catalisador Universal Celta/Corsa', sku: 'CAT-GM-002', category: 'Catalisadores', costPrice: 350.00, sellingPrice: 750.00, stock: 4, minStock: 2, location: 'Prateleira B3' },
    { name: 'Ponteira Esportiva Dupla Inox', sku: 'PONT-ESP-05', category: 'Ponteiras', costPrice: 85.00, sellingPrice: 190.00, stock: 8, minStock: 4, location: 'Vitrine 1' },
    { name: 'Abraçadeira U-Bolt 2 Polegadas', sku: 'ABR-U-200', category: 'Abraçadeiras', costPrice: 2.50, sellingPrice: 15.00, stock: 150, minStock: 30, location: 'Caixa 04' },
    { name: 'Sonda Lambda Fiat Uno Fire', sku: 'SON-FIA-01', category: 'Injeção', costPrice: 90.00, sellingPrice: 220.00, stock: 6, minStock: 2, location: 'Prateleira C1' },
    { name: 'Tubo Intermediário Palio 1.0', sku: 'TUB-PAL-03', category: 'Escapamentos', costPrice: 95.00, sellingPrice: 210.00, stock: 5, minStock: 3, location: 'Prateleira A2' },
    { name: 'Junta do Coletor de Escapamento (Universal)', sku: 'JUN-COL-00', category: 'Consumíveis', costPrice: 8.00, sellingPrice: 35.00, stock: 45, minStock: 10, location: 'Gaveteiro 2' },
    { name: 'Coxim do Escapamento de Borracha (GM)', sku: 'COX-GM-11', category: 'Consumíveis', costPrice: 5.50, sellingPrice: 25.00, stock: 60, minStock: 15, location: 'Gaveteiro 1' },
    { name: 'Silencioso Dianteiro HB20 1.0', sku: 'SIL-HYU-01', category: 'Escapamentos', costPrice: 140.00, sellingPrice: 320.00, stock: 2, minStock: 3, location: 'Prateleira A3' },
    { name: 'Veda Escapamento (Pasta Alta Temp)', sku: 'VEDA-TEMP-1', category: 'Consumíveis', costPrice: 12.00, sellingPrice: 38.00, stock: 22, minStock: 5, location: 'Armário' },
    { name: 'Tubo Flexível Malha de Aço 50x200', sku: 'FLEX-50200', category: 'Escapamentos', costPrice: 55.00, sellingPrice: 140.00, stock: 10, minStock: 4, location: 'Prateleira B1' },
    { name: 'Protetor de Cárter Onix 2020+', sku: 'PRO-CAR-01', category: 'Acessórios', costPrice: 85.00, sellingPrice: 180.00, stock: 5, minStock: 2, location: 'Estoque Fundo' },
    { name: 'Abraçadeira Cinta Larga 2.5"', sku: 'ABR-CIN-250', category: 'Abraçadeiras', costPrice: 4.00, sellingPrice: 20.00, stock: 80, minStock: 20, location: 'Caixa 05' },
    { name: 'Silencioso Esportivo JK', sku: 'SIL-JK-ESP', category: 'Escapamentos', costPrice: 70.00, sellingPrice: 160.00, stock: 15, minStock: 5, location: 'Vitrine 2' },
    { name: 'Catalisador Específico Honda Civic 07/11', sku: 'CAT-HON-07', category: 'Catalisadores', costPrice: 850.00, sellingPrice: 1600.00, stock: 1, minStock: 1, location: 'Cofre' },
  ];

  for (const prod of produtosMocados) {
    const product = await prisma.product.create({
      data: {
        ...prod,
        tenantId,
      }
    });
    // Registra a entrada no histórico de transações
    await prisma.inventoryTransaction.create({
      data: {
        type: 'IN',
        quantity: prod.stock,
        reason: 'Estoque Inicial (Setup Sistema)',
        productId: product.id,
        tenantId,
      }
    });
  }

  // 3. INSERINDO CLIENTES E VEÍCULOS
  console.log('👥 Semeando Clientes e Veículos...');
  const clientesMocados = [
    {
      name: 'Carlos Eduardo Silva', phone: '11987654321', document: '12345678901', email: 'carlos.eduardo@email.com',
      cep: '01001-000', street: 'Praça da Sé', number: '12', neighborhood: 'Sé', city: 'São Paulo', state: 'SP',
      notes: 'Cliente exigente. Prefere peças originais.',
      vehicles: [{ plate: 'ABC1234', brand: 'Fiat', model: 'Uno Way', year: 2015 }]
    },
    {
      name: 'Mariana Costa', phone: '11912345678', document: '98765432100', email: 'mariana.costa@email.com',
      cep: '04571-000', street: 'Avenida Engenheiro Luís Carlos Berrini', number: '1500', neighborhood: 'Brooklin', city: 'São Paulo', state: 'SP',
      notes: 'Trabalha perto da oficina, sempre deixa o carro de manhã e busca no fim da tarde.',
      vehicles: [{ plate: 'XYZ9876', brand: 'Volkswagen', model: 'Gol G6', year: 2014 }, { plate: 'DEF5678', brand: 'Honda', model: 'HR-V', year: 2021 }]
    },
    {
      name: 'Roberto Almeida Sousa', phone: '11977778888', document: '45612378912', email: 'roberto.almeida@empresa.com.br',
      cep: '05407-000', street: 'Rua Cardeal Arcoverde', number: '201', complement: 'Apto 45', neighborhood: 'Pinheiros', city: 'São Paulo', state: 'SP',
      vehicles: [{ plate: 'QWE1A23', brand: 'Chevrolet', model: 'Onix Plus', year: 2022 }]
    },
    {
      name: 'Fernanda Lima (Uber)', phone: '11966665555', document: '32165498733',
      cep: '03318-000', street: 'Rua Itapura', number: '800', neighborhood: 'Tatuapé', city: 'São Paulo', state: 'SP',
      notes: 'Motorista de aplicativo. Precisa de serviço rápido. Dar desconto de parceiro.',
      vehicles: [{ plate: 'HGF9B12', brand: 'Hyundai', model: 'HB20', year: 2019 }]
    },
    {
      name: 'Lucas Santos', phone: '11955554444', document: '15975345688', email: 'lucassantos1990@gmail.com',
      city: 'São Paulo', state: 'SP',
      vehicles: [{ plate: 'JKL3456', brand: 'Toyota', model: 'Corolla Altis', year: 2018 }]
    },
    {
      name: 'Auto Escola Direção Certa', phone: '1133332222', document: '12345678000199', email: 'contato@direcaocerta.com',
      cep: '02011-000', street: 'Rua Voluntários da Pátria', number: '1520', neighborhood: 'Santana', city: 'São Paulo', state: 'SP',
      notes: 'Faturar NF para CNPJ. Prazo de 15 dias para pagamento.',
      vehicles: [{ plate: 'MNO7890', brand: 'Fiat', model: 'Mobi', year: 2023 }, { plate: 'PQR1234', brand: 'Fiat', model: 'Mobi', year: 2023 }]
    },
    {
      name: 'Juliana Mendes', phone: '11999991111', 
      vehicles: [{ plate: 'STU5678', brand: 'Ford', model: 'Ka', year: 2017 }]
    },
    {
      name: 'Empresa Logística Rápida', document: '98765432000111', phone: '1144445555',
      vehicles: [{ plate: 'VWX9012', brand: 'Renault', model: 'Kangoo', year: 2020 }, { plate: 'YZA3456', brand: 'Fiat', model: 'Fiorino', year: 2021 }]
    },
    {
      name: 'Thiago Oliveira', phone: '11988887777', email: 'thiago.oliveira.dev@gmail.com',
      vehicles: [{ plate: 'BCA4321', brand: 'Jeep', model: 'Renegade', year: 2019 }]
    },
    {
      name: 'Patrícia Rocha', phone: '11977776666',
      notes: 'Reclama de barulho solto na parte de baixo do carro frequentemente.',
      vehicles: [{ plate: 'FED8765', brand: 'Peugeot', model: '208', year: 2018 }]
    }
  ];

  for (const cliente of clientesMocados) {
    const { vehicles, ...customerData } = cliente;
    
    await prisma.customer.create({
      data: {
        ...customerData,
        tenantId,
        vehicles: {
          create: vehicles.map(v => ({ ...v, tenantId }))
        }
      }
    });
  }

  console.log('✅ Semeadura concluída com sucesso!');
  console.log('--------------------------------------------------');
  console.log('Seu banco de dados agora tem uma cara profissional!');
  console.log('Use o login do cliente para testar: dono@oficina.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });