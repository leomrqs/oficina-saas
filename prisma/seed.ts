// prisma/seed.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

// ============================================================================
// MOTORES DE DADOS E INTELIGÊNCIA ARTIFICIAL DO SEED
// ============================================================================

// Definindo o período exato solicitado (16/03/2025 a 16/03/2026)
const START_DATE = new Date('2025-03-16T00:00:00Z');
const END_DATE = new Date('2026-03-16T23:59:59Z');

// Função para gerar data aleatória dentro do período
const getRandomDate = () => {
  const start = START_DATE.getTime();
  const end = END_DATE.getTime();
  return new Date(start + Math.random() * (end - start));
};

// Função para adicionar horas a uma data (Simular linha do tempo do Histórico da OS)
const addHours = (date: Date, hours: number) => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (array: any[]) => array[getRandomInt(0, array.length - 1)];

// Bando de Dados Algorítmico (Combinatória)
const nomes = ['Carlos', 'Mariana', 'Roberto', 'Fernanda', 'Lucas', 'Juliana', 'Thiago', 'Patrícia', 'André', 'Camila', 'Marcos', 'Aline', 'João', 'Letícia', 'Felipe', 'Beatriz', 'Diego', 'Vanessa', 'Ricardo', 'Amanda', 'Leandro', 'Bruna', 'Gabriel', 'Carolina', 'Marcelo'];
const sobrenomes = ['Silva', 'Costa', 'Almeida', 'Santos', 'Oliveira', 'Rocha', 'Mendes', 'Farias', 'Souza', 'Lima', 'Gomes', 'Ferreira', 'Rodrigues', 'Carvalho', 'Martins', 'Araújo', 'Ribeiro', 'Dias', 'Castro', 'Nunes'];

const carros = [
  { b: 'Fiat', m: ['Uno', 'Mobi', 'Argo', 'Toro', 'Strada', 'Palio', 'Pulse', 'Cronos'] },
  { b: 'Volkswagen', m: ['Gol', 'Polo', 'Nivus', 'T-Cross', 'Amarok', 'Saveiro', 'Virtus'] },
  { b: 'Chevrolet', m: ['Onix', 'Tracker', 'S10', 'Cruze', 'Spin', 'Montana', 'Equinox'] },
  { b: 'Hyundai', m: ['HB20', 'Creta', 'Tucson', 'Santa Fe'] },
  { b: 'Toyota', m: ['Corolla', 'Hilux', 'Yaris', 'SW4', 'Corolla Cross'] },
  { b: 'Jeep', m: ['Renegade', 'Compass', 'Commander'] },
  { b: 'Honda', m: ['Civic', 'HR-V', 'City', 'Fit', 'CR-V'] },
  { b: 'Nissan', m: ['Kicks', 'Frontier', 'Versa'] },
  { b: 'Renault', m: ['Kwid', 'Duster', 'Sandero', 'Logan', 'Captur'] },
  { b: 'Ford', m: ['Ka', 'Ranger', 'EcoSport', 'Bronco'] }
];

const reclamacoes = [
  'Barulho na suspensão ao passar em buracos.', 'Luz da injeção acesa e perda de potência.', 'Ar condicionado não gela, apenas ventila.',
  'Freio assobiando e pedal duro.', 'Vazamento de óleo escuro na garagem.', 'Carro superaquecendo no trânsito.',
  'Direção puxando para o lado direito.', 'Bateria arriou, não dá partida.', 'Revisão preventiva de 50.000km.',
  'Troca de óleo e filtros padrão.', 'Vidro elétrico do motorista não sobe.', 'Marcha arranhando ao engatar a segunda.',
  'Cheiro forte de combustível dentro do carro.', 'Limpador de parabrisa ressecado.', 'Pneu desgastado de forma irregular.',
  'Luz do ABS acesa intermitente.', 'Estalos ao esterçar o volante todo.', 'Motor morrendo em marcha lenta.'
];

const despesasTitulos = ['Conta de Energia', 'Conta de Água', 'Internet Fibra', 'Compra de Peças (Distribuidora Auto)', 'Material de Escritório', 'Material de Limpeza', 'Marketing (Anúncios Google/Insta)', 'Manutenção de Equipamentos', 'Impostos (DAS/Simples Nacional)'];

async function main() {
  console.log('🚀 INICIANDO A SUPER SEMEADURA NÍVEL A+ (PERÍODO 16/03/2025 A 16/03/2026)...');

  const tenantId = 'cmmmrvbkk00007gllmv6eh7er';
  const hashedPassword = await bcrypt.hash('123456', 10);

  // ============================================================================
  // 1. CRIAÇÃO DO TENANT E USUÁRIOS
  // ============================================================================
  console.log('🏢 [1/8] Configurando Oficina e Acessos...');
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { monthlyGoal: 150000.0 }, // Oficina faturando bem!
    create: {
      id: tenantId,
      name: 'Auto Center Premium (Demo)',
      cnpj: '11.111.111/0001-11',
      phone: '11999999999',
      address: 'Avenida das Nações Unidas, 1234 - São Paulo, SP',
      monthlyGoal: 150000.0,
      users: {
        create: { name: 'João Gestor (Dono)', email: 'dono@oficina.com', password: hashedPassword, role: 'MANAGER' },
      },
    },
  });

  await prisma.tenant.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'SaaS Master Admin',
      cnpj: '00.000.000/0001-00',
      users: { create: { name: 'Leo (Dono do SaaS)', email: 'admin@saas.com', password: hashedPassword, role: 'SUPER_ADMIN' } },
    },
  });

  // ============================================================================
  // 2. LIMPEZA SEGURA DO BANCO
  // ============================================================================
  console.log('🧹 [2/8] Destruindo dados antigos para reconstrução limpa...');
  await prisma.orderHistory.deleteMany({ where: { tenantId } });
  await prisma.financialTransaction.deleteMany({ where: { tenantId } });
  await prisma.fixedExpense.deleteMany({ where: { tenantId } });
  await prisma.orderMechanic.deleteMany({ where: { employee: { tenantId } } });
  await prisma.orderItem.deleteMany({ where: { tenantId } });
  await prisma.order.deleteMany({ where: { tenantId } });
  await prisma.employee.deleteMany({ where: { tenantId } });
  await prisma.inventoryTransaction.deleteMany({ where: { tenantId } });
  await prisma.vehicle.deleteMany({ where: { tenantId } });
  await prisma.product.deleteMany({ where: { tenantId } });
  await prisma.customer.deleteMany({ where: { tenantId } });

  // ============================================================================
  // 3. EQUIPE DE FUNCIONÁRIOS (RH)
  // ============================================================================
  console.log('👨‍🔧 [3/8] Contratando Equipe Especializada...');
  const funcoes = ['Mecânico Chefe', 'Especialista em Injeção', 'Alinhamento/Balanceamento', 'Auxiliar Mecânico', 'Eletricista Automotivo', 'Borracheiro', 'Atendente/Caixa', 'Gerente de Peças'];
  const nomesFuncionarios = ['Roberto Silva', 'Lucas Mendes', 'Thiago Rocha', 'Marcos Paulo', 'Fernando Alves', 'Diego Costa', 'Camila Torres', 'Aline Castro'];
  const dbEmployees = [];
  for (let i = 0; i < nomesFuncionarios.length; i++) {
    const emp = await prisma.employee.create({
      data: { name: nomesFuncionarios[i], role: funcoes[i], phone: `1198888000${i}`, tenantId }
    });
    dbEmployees.push(emp);
  }

  // ============================================================================
  // 4. CATÁLOGO DE ESTOQUE RICO (45 PRODUTOS)
  // ============================================================================
  console.log('📦 [4/8] Abastecendo o Estoque com 45 tipos de peças (Milhares de unidades)...');
  const catPeças = [
    { n: 'Pastilha de Freio Cobreq Dianteira', c: 'Freios', cp: 45, sp: 130 },
    { n: 'Pastilha de Freio TRW Traseira', c: 'Freios', cp: 55, sp: 150 },
    { n: 'Disco de Freio Fremax Ventilado', c: 'Freios', cp: 120, sp: 280 },
    { n: 'Fluido de Freio DOT4 Bosch (500ml)', c: 'Fluidos', cp: 18, sp: 45 },
    { n: 'Amortecedor Nakata Dianteiro', c: 'Suspensão', cp: 190, sp: 420 },
    { n: 'Amortecedor Monroe Traseiro', c: 'Suspensão', cp: 160, sp: 380 },
    { n: 'Kit Batente e Coifa (Universal)', c: 'Suspensão', cp: 40, sp: 95 },
    { n: 'Bandeja de Suspensão C/ Pivô', c: 'Suspensão', cp: 145, sp: 310 },
    { n: 'Bieleta da Barra Estabilizadora', c: 'Suspensão', cp: 35, sp: 80 },
    { n: 'Óleo Motor 5W30 Sintético Castrol (1L)', c: 'Lubrificantes', cp: 30, sp: 65 },
    { n: 'Óleo Motor 10W40 Semissintético ELF (1L)', c: 'Lubrificantes', cp: 25, sp: 55 },
    { n: 'Óleo Motor 15W40 Mineral Mobil (1L)', c: 'Lubrificantes', cp: 20, sp: 45 },
    { n: 'Óleo de Câmbio Automático ATF (1L)', c: 'Lubrificantes', cp: 60, sp: 140 },
    { n: 'Filtro de Óleo Tecfil', c: 'Filtros', cp: 15, sp: 35 },
    { n: 'Filtro de Ar do Motor Mann', c: 'Filtros', cp: 22, sp: 50 },
    { n: 'Filtro de Combustível Mahle', c: 'Filtros', cp: 18, sp: 40 },
    { n: 'Filtro de Ar Condicionado (Cabine)', c: 'Filtros', cp: 15, sp: 45 },
    { n: 'Vela de Ignição NGK Iridium (Jogo)', c: 'Injeção', cp: 120, sp: 280 },
    { n: 'Cabo de Vela Bosch Silicone', c: 'Injeção', cp: 85, sp: 170 },
    { n: 'Bobina de Ignição Delphi', c: 'Injeção', cp: 180, sp: 390 },
    { n: 'Bico Injetor Magneti Marelli', c: 'Injeção', cp: 110, sp: 250 },
    { n: 'Bomba de Combustível Refil Bosch', c: 'Motor', cp: 90, sp: 220 },
    { n: 'Correia Dentada Gates', c: 'Motor', cp: 65, sp: 160 },
    { n: 'Correia do Alternador Poly-V', c: 'Motor', cp: 45, sp: 110 },
    { n: 'Tensor da Correia SKF', c: 'Motor', cp: 95, sp: 210 },
    { n: 'Bomba D\'Água Urba', c: 'Motor', cp: 130, sp: 290 },
    { n: 'Válvula Termostática Wahler', c: 'Motor', cp: 75, sp: 170 },
    { n: 'Aditivo Radiador Rosa Paraflu (1L)', c: 'Fluidos', cp: 15, sp: 38 },
    { n: 'Silencioso Traseiro Mastra', c: 'Escapamentos', cp: 150, sp: 320 },
    { n: 'Catalisador Universal', c: 'Escapamentos', cp: 350, sp: 780 },
    { n: 'Bateria Moura 60Ah', c: 'Elétrica', cp: 320, sp: 590 },
    { n: 'Bateria Heliar 45Ah', c: 'Elétrica', cp: 280, sp: 510 },
    { n: 'Lâmpada Farol H4 Philips (Par)', c: 'Elétrica', cp: 40, sp: 95 },
    { n: 'Lâmpada Pingo LED T10 (Par)', c: 'Elétrica', cp: 10, sp: 35 },
    { n: 'Palheta Limpador Bosch Aerotwin (Par)', c: 'Acessórios', cp: 50, sp: 120 },
    { n: 'Higienizador Ar Condicionado Granada', c: 'Estética', cp: 12, sp: 45 },
    { n: 'Gás Refrigerante R134a (Carga)', c: 'Ar Condicionado', cp: 45, sp: 150 },
    { n: 'Pneu Michelin 175/70 R14', c: 'Pneus', cp: 350, sp: 550 },
    { n: 'Pneu Pirelli 205/55 R16', c: 'Pneus', cp: 480, sp: 750 },
    { n: 'Bico de Pneu Válvula TR413', c: 'Pneus', cp: 2, sp: 15 },
    { n: 'Descarbonizante Car 80', c: 'Fluidos', cp: 18, sp: 45 },
    { n: 'Limpa Contato Spray', c: 'Fluidos', cp: 15, sp: 40 },
    { n: 'Junta Tampa de Válvula Sabó', c: 'Motor', cp: 25, sp: 65 },
    { n: 'Coxim do Motor Axios', c: 'Suspensão', cp: 110, sp: 250 },
    { n: 'Rolamento Roda Dianteira SKF', c: 'Suspensão', cp: 85, sp: 190 },
  ];

  const dbProducts = [];
  for (const p of catPeças) {
    const prod = await prisma.product.create({
      data: { name: p.n, category: p.c, costPrice: p.cp, sellingPrice: p.sp, stock: 500, minStock: 20, tenantId } // Estoque inicial altíssimo para aguentar 1 ano de OS
    });
    dbProducts.push(prod);
    await prisma.inventoryTransaction.create({
      data: { type: 'IN', quantity: 500, reason: 'Compra de Lote Anual (Setup)', productId: prod.id, tenantId, createdAt: START_DATE }
    });
  }

  // ============================================================================
  // 5. GERAÇÃO DE 100 CLIENTES E VEÍCULOS (ALGORÍTMICO)
  // ============================================================================
  console.log('👥 [5/8] Gerando 100 Clientes Reais e vinculando Veículos...');
  const dbCustomers = [];
  for (let i = 0; i < 100; i++) {
    const nomeCompleto = `${getRandomItem(nomes)} ${getRandomItem(sobrenomes)} ${i % 3 === 0 ? getRandomItem(sobrenomes) : ''}`.trim();
    const isPj = i % 15 === 0; // Algumas frotas
    
    // Gerar 1 a 3 carros por cliente
    const vCount = isPj ? getRandomInt(2, 5) : getRandomInt(1, 2);
    const veiculosDoCliente = [];
    
    for(let j=0; j<vCount; j++) {
      const marca = getRandomItem(carros);
      veiculosDoCliente.push({
        plate: `${String.fromCharCode(65 + getRandomInt(0,25))}${String.fromCharCode(65 + getRandomInt(0,25))}${String.fromCharCode(65 + getRandomInt(0,25))}${getRandomInt(1,9)}${String.fromCharCode(65 + getRandomInt(0,25))}${getRandomInt(10,99)}`,
        brand: marca.b,
        model: getRandomItem(marca.m),
        year: getRandomInt(2010, 2024),
        tenantId
      });
    }

    const cust = await prisma.customer.create({
      data: {
        name: isPj ? `${nomeCompleto} LTDA` : nomeCompleto,
        document: `000000000${i}00`,
        phone: '119' + getRandomInt(10000000, 99999999),
        tenantId,
        vehicles: { create: veiculosDoCliente }
      },
      include: { vehicles: true }
    });
    dbCustomers.push(cust);
  }

  // ============================================================================
  // 6. MOTOR DO TEMPO: 600 ORDENS DE SERVIÇO EM 1 ANO
  // ============================================================================
  console.log('🕰️ [6/8] O Motor do Tempo foi ativado! Criando 600 OS (Pode levar de 15 a 30 segundos)...');
  
  let incomeAcumulado = 0;

  for (let i = 1; i <= 600; i++) {
    const isCanceled = i % 20 === 0; // 5% de chance de ser cancelada
    const osDate = getRandomDate();
    const cust = getRandomItem(dbCustomers);
    const veh = getRandomItem(cust.vehicles);
    const mech = getRandomItem(dbEmployees);
    const problem = getRandomItem(reclamacoes);
    
    // Montar os itens da OS
    const items = [];
    let partsTotal = 0;
    
    // Serviço Base
    const laborPrice = getRandomInt(80, 500);
    items.push({ name: 'Mão de Obra / Serviço Técnico', isLabor: true, quantity: 1, unitPrice: laborPrice, total: laborPrice, tenantId });
    
    // Adicionar de 1 a 4 peças
    const numPecas = getRandomInt(1, 4);
    const pecasEscolhidas = [];
    for(let j=0; j<numPecas; j++) {
      const p = getRandomItem(dbProducts);
      // Evitar duplicar a mesma peça na mesma OS
      if(!pecasEscolhidas.includes(p.id)) {
        pecasEscolhidas.push(p.id);
        const qtd = (p.category === 'Lubrificantes' || p.category === 'Injeção') ? getRandomInt(1, 4) : 1;
        const tot = p.sellingPrice * qtd;
        partsTotal += tot;
        items.push({ name: p.name, isLabor: false, productId: p.id, quantity: qtd, unitPrice: p.sellingPrice, total: tot, tenantId });
      }
    }

    const discount = i % 5 === 0 ? getRandomInt(10, 50) : 0;
    const grandTotal = partsTotal + laborPrice - discount;
    const finalStatus = isCanceled ? 'CANCELED' : 'COMPLETED';

    // Criar a OS com nested relations (MUITO mais rápido que fazer separado)
    const os = await prisma.order.create({
      data: {
        status: finalStatus,
        laborTotal: laborPrice, partsTotal, discount, total: grandTotal,
        mileage: `${getRandomInt(10, 150)}.000`,
        problem,
        customerId: cust.id, vehicleId: veh.id, tenantId,
        createdAt: osDate, updatedAt: addHours(osDate, getRandomInt(2, 48)),
        items: { create: items },
        mechanics: { create: [{ employeeId: mech.id, task: 'Execução Total' }] },
        // Criar o Histórico/Timeline Algorítmico
        history: {
          create: [
            { newStatus: 'PENDING', notes: 'Orçamento gerado pelo sistema.', tenantId, createdAt: osDate },
            { oldStatus: 'PENDING', newStatus: isCanceled ? 'CANCELED' : 'APPROVED', notes: isCanceled ? 'Cliente achou caro.' : 'Aprovado pelo cliente.', tenantId, createdAt: addHours(osDate, 1) },
            ...(isCanceled ? [] : [
              { oldStatus: 'APPROVED', newStatus: 'IN_PROGRESS', notes: 'Iniciado serviço no elevador.', tenantId, createdAt: addHours(osDate, 2) },
              { oldStatus: 'IN_PROGRESS', newStatus: 'COMPLETED', notes: 'Finalizado e faturado. Baixa de estoque.', tenantId, createdAt: addHours(osDate, getRandomInt(4, 48)) }
            ])
          ]
        }
      }
    });

    if (!isCanceled) {
      incomeAcumulado += grandTotal;
      // Registrar Financeiro
      await prisma.financialTransaction.create({
        data: {
          title: `OS #${os.number} - ${cust.name.split(' ')[0]}`,
          type: 'INCOME', category: 'Serviços Automotivos', amount: grandTotal,
          status: 'PAID', paymentMethod: getRandomItem(['PIX', 'Cartão de Crédito', 'Débito', 'Dinheiro']),
          dueDate: osDate, paymentDate: addHours(osDate, getRandomInt(4, 48)), orderId: os.id, tenantId, createdAt: osDate
        }
      });
      // Registrar Baixa de Estoque (Física de Inventário)
      for(const item of items) {
        if(!item.isLabor && item.productId) {
          await prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
          await prisma.inventoryTransaction.create({
            data: { type: 'OUT', quantity: item.quantity, reason: `OS #${os.number}`, productId: item.productId, tenantId, createdAt: addHours(osDate, getRandomInt(4, 48)) }
          });
        }
      }
    }
  }

  // ============================================================================
  // 7. DESPESAS E CUSTOS (300 REGISTROS NO ANO PARA O DRE FAZER SENTIDO)
  // ============================================================================
  console.log('💸 [7/8] Lançando 300 despesas operacionais distribuídas no ano...');
  
  // Despesas Fixas (Modelos)
  await prisma.fixedExpense.createMany({
    data: [
      { title: 'Aluguel do Galpão', category: 'Infraestrutura', amount: 4500.00, dueDay: 5, tenantId },
      { title: 'Conta de Luz (Enel)', category: 'Água / Luz / Internet', amount: 1150.00, dueDay: 15, tenantId },
      { title: 'Internet Fibra Ótica', category: 'Água / Luz / Internet', amount: 140.00, dueDay: 20, tenantId },
      { title: 'Contabilidade', category: 'Impostos e Taxas', amount: 600.00, dueDay: 10, tenantId },
      { title: 'Sistema Oficina SaaS Premium', category: 'Software e Sistemas', amount: 250.00, dueDay: 10, tenantId },
    ]
  });

  // Despesas Variáveis pulverizadas
  const despesasData = [];
  for (let i = 0; i < 300; i++) {
    const expDate = getRandomDate();
    despesasData.push({
      title: getRandomItem(despesasTitulos),
      type: 'EXPENSE' as any, category: 'Custos Operacionais', amount: getRandomInt(150, 2000),
      status: 'PAID' as any, paymentDate: expDate, dueDate: expDate, tenantId, createdAt: expDate
    });
  }
  await prisma.financialTransaction.createMany({ data: despesasData });

  // ============================================================================
  // 8. POPULANDO O PÁTIO/KANBAN COM CARROS ATIVOS "HOJE"
  // ============================================================================
  console.log('🚧 [8/8] Estacionando 15 carros no Pátio Virtual para uso imediato...');
  
  // Funções Auxiliares para o Kanban
  const NOW = new Date('2026-03-16T12:00:00Z'); // Current Context Time
  
  const createActive = async (status: any, prob: string, hrsAgo: number) => {
    const cust = getRandomItem(dbCustomers);
    const veh = getRandomItem(cust.vehicles);
    const p1 = getRandomItem(dbProducts);
    const d = addHours(NOW, -hrsAgo);

    const os = await prisma.order.create({
      data: {
        status, problem: prob, laborTotal: 200, partsTotal: p1.sellingPrice, total: 200 + p1.sellingPrice,
        mileage: `${getRandomInt(10, 100)}.000`, fuelLevel: '1/2',
        customerId: cust.id, vehicleId: veh.id, tenantId, createdAt: addHours(d, -2), updatedAt: d,
        items: {
          create: [
            { name: 'Mão de Obra', isLabor: true, quantity: 1, unitPrice: 200, total: 200, tenantId },
            { name: p1.name, isLabor: false, productId: p1.id, quantity: 1, unitPrice: p1.sellingPrice, total: p1.sellingPrice, tenantId }
          ]
        },
        mechanics: { create: [{ employeeId: getRandomItem(dbEmployees).id, task: 'Diagnóstico Atual' }] },
        history: { create: [{ newStatus: status, notes: `Movido para o pátio (${status}).`, tenantId, createdAt: d }] }
      }
    });
  };

  // Status Variados para colorir o Kanban
  await createActive('PENDING', 'Cliente deixou o carro de manhã e reclamou de barulho na roda.', 2);
  await createActive('PENDING', 'Solicitou orçamento completo para viagem de férias.', 5);
  await createActive('PENDING', 'Carro chegou guinchado. Não dá partida.', 12);
  
  await createActive('APPROVED', 'Cliente autorizou a troca dos amortecedores via WhatsApp.', 1);
  await createActive('APPROVED', 'Troca de óleo autorizada, aguardando liberar elevador.', 3);
  
  await createActive('WAITING_PARTS', 'Aguardando chegar a bobina de ignição da distribuidora (previsão 14h).', 24);
  await createActive('WAITING_PARTS', 'Parachoque na pintura.', 48);
  
  await createActive('IN_PROGRESS', 'Carro no Elevador 1. Desmontando cabeçote.', 4);
  await createActive('IN_PROGRESS', 'Alinhamento e Balanceamento em andamento.', 1);
  await createActive('IN_PROGRESS', 'Eletricista refazendo chicote da injeção.', 8);
  
  await createActive('READY', 'Lavadinho e pronto para entrega. Avisar cliente.', 2);
  await createActive('READY', 'Revisão finalizada. NF emitida.', 6);

  console.log('✅ =========================================================');
  console.log(`✅ MEGA SEMEADURA CONCLUÍDA!`);
  console.log(`📊 Mais de R$ ${incomeAcumulado.toLocaleString('pt-BR')} em faturamento simulado.`);
  console.log('✅ =========================================================');
  console.log('Logins para o Sistema:');
  console.log('-> Dono da Oficina : dono@oficina.com / 123456');
  console.log('-> Dono do SaaS    : admin@saas.com   / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });