// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, FileText, Wrench, AlertTriangle, Building, ArrowUpRight, ArrowDownRight, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FinancialChart, OSStatusChart } from "./DashboardCharts";
import { Button } from "@/components/ui/button";
import { DashboardFilter } from "./DashboardFilter"; 

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ from?: string, to?: string }> }) {
  const session = await getServerSession(authOptions);
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const tenantId = session?.user?.tenantId;

  if (isSuperAdmin || !tenantId) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Painel Administrativo SaaS</h2>
        <Card className="bg-zinc-900 text-white transition-all duration-300 hover:shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Visão Global do Sistema</CardTitle></CardHeader>
          <CardContent><p className="text-zinc-400">Este painel será desenvolvido futuramente.</p></CardContent>
        </Card>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RESOLVENDO A PROMISE DO NEXT.JS 15 PARA LER A URL
  // -----------------------------------------------------------------
  const params = await searchParams;

  // -----------------------------------------------------------------
  // LÓGICA DE DATAS (MÁQUINA DO TEMPO)
  // -----------------------------------------------------------------
  const now = new Date();
  let startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Padrão: Este Mês
  let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Se o utilizador usou o filtro na URL, substituímos as datas
  if (params?.from && params?.to) {
    startDate = new Date(`${params.from}T00:00:00`);
    endDate = new Date(`${params.to}T23:59:59`);
  }

  // Calcula o período anterior exato para fazer a % de crescimento
  const diffTime = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - diffTime - 1);
  const prevEndDate = new Date(startDate.getTime() - 1);

  // 1. Receita do Período Selecionado vs Período Anterior
  const currentPeriodIncome = await prisma.financialTransaction.aggregate({
    where: { tenantId, type: "INCOME", status: "PAID", paymentDate: { gte: startDate, lte: endDate } },
    _sum: { amount: true }
  });
  
  const lastPeriodIncome = await prisma.financialTransaction.aggregate({
    where: { tenantId, type: "INCOME", status: "PAID", paymentDate: { gte: prevStartDate, lte: prevEndDate } },
    _sum: { amount: true }
  });

  const revCurrent = currentPeriodIncome._sum.amount || 0;
  const revLast = lastPeriodIncome._sum.amount || 0;
  
  let revPercent = 0;
  if (revLast > 0) revPercent = ((revCurrent - revLast) / revLast) * 100;
  else if (revCurrent > 0) revPercent = 100;

  // 2. Orçamentos Abertos (Criados no Período e ainda Pendentes)
  const pendingOrdersCount = await prisma.order.count({
    where: { tenantId, status: "PENDING", createdAt: { gte: startDate, lte: endDate } }
  });

  // 3. Serviços Movimentados no Período (Aprovados ou Finalizados)
  const servicesInPeriodCount = await prisma.order.count({
    where: { tenantId, updatedAt: { gte: startDate, lte: endDate }, status: { in: ["APPROVED", "COMPLETED"] } }
  });

  // 4. Estoque Crítico (O stock é TEMPO REAL, o filtro de data não afeta isso)
  const allProducts = await prisma.product.findMany({
    where: { tenantId }, select: { id: true, name: true, sku: true, stock: true, minStock: true }
  });
  const criticalProductsAll = allProducts.filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock);
  const topCriticalProducts = criticalProductsAll.slice(0, 6);

  // 5. Gráfico Financeiro Inteligente (Dinâmico conforme a data)
  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId, paymentDate: { gte: startDate, lte: endDate }, status: "PAID" },
    select: { amount: true, type: true, paymentDate: true }
  });

  // Decide se agrupa por DIA ou por MÊS baseado no tamanho do filtro
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const groupBy = diffDays <= 35 ? 'day' : 'month';
  const dataMap = new Map();

  // Pré-preenche o gráfico para não ter "buracos"
  if (groupBy === 'day') {
    for(let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
       const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
       dataMap.set(key, { name: key, receitas: 0, despesas: 0 });
    }
  } else {
    for(let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1); d <= endDate; d.setMonth(d.getMonth() + 1)) {
       const monthYear = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
       const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
       dataMap.set(key, { name: key, receitas: 0, despesas: 0 });
    }
  }

  transactions.forEach(t => {
    if (!t.paymentDate) return;
    const d = new Date(t.paymentDate);
    let key = "";
    if (groupBy === 'day') key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    else {
      const monthYear = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    }

    if (dataMap.has(key)) {
      const entry = dataMap.get(key);
      if (t.type === 'INCOME') entry.receitas += t.amount;
      if (t.type === 'EXPENSE') entry.despesas += t.amount;
    }
  });
  const financialChartData = Array.from(dataMap.values());

  // 6. Gráfico de Status das OS no Período
  const osStatusCount = await prisma.order.groupBy({
    by: ['status'],
    where: { tenantId, createdAt: { gte: startDate, lte: endDate } },
    _count: true,
  });

  const osChartData = [
    { name: "Orçamentos", value: osStatusCount.find(x => x.status === "PENDING")?._count || 0, fill: "#eab308" },
    { name: "Em Serviço", value: osStatusCount.find(x => x.status === "APPROVED")?._count || 0, fill: "#3b82f6" },
    { name: "Finalizadas", value: osStatusCount.find(x => x.status === "COMPLETED")?._count || 0, fill: "#10b981" },
    { name: "Canceladas", value: osStatusCount.find(x => x.status === "CANCELED")?._count || 0, fill: "#ef4444" },
  ];

  // 7. Últimas 6 Ordens de Serviço do Período
  const recentOrders = await prisma.order.findMany({
    where: { tenantId, updatedAt: { gte: startDate, lte: endDate } },
    orderBy: { updatedAt: 'desc' },
    take: 6,
    include: { customer: { select: { name: true } }, vehicle: { select: { plate: true, brand: true, model: true } } }
  });

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Orçamento</Badge>;
      case "APPROVED": return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Em Serviço</Badge>;
      case "COMPLETED": return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Finalizado</Badge>;
      case "CANCELED": return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visão Geral da Oficina</h2>
          <p className="text-zinc-500 text-sm">Acompanhe os resultados e métricas no período selecionado.</p>
        </div>
      </div>

      <DashboardFilter />

      {/* CARDS DE RESUMO */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Período</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(revCurrent)}</div>
            <p className={`text-xs flex items-center mt-1 font-medium ${revPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {revPercent >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1"/> : <ArrowDownRight className="w-3 h-3 mr-1"/>}
              {Math.abs(revPercent).toFixed(1)}% vs Período Anterior
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos (No Período)</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrdersCount}</div>
            <p className="text-xs text-zinc-500 mt-1">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços (No Período)</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicesInPeriodCount}</div>
            <p className="text-xs text-zinc-500 mt-1">Aprovados ou finalizados</p>
          </CardContent>
        </Card>

        {/* Estoque atual */}
        <Card className={`transition-all duration-300 hover:shadow-md border-l-4 ${criticalProductsAll.length > 0 ? 'border-l-red-500 bg-red-50/30' : 'border-l-zinc-300'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${criticalProductsAll.length > 0 ? 'text-red-600' : 'text-zinc-600'}`}>Estoque Crítico Atual</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${criticalProductsAll.length > 0 ? 'text-red-600' : 'text-zinc-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalProductsAll.length > 0 ? 'text-red-600' : 'text-zinc-900'}`}>{criticalProductsAll.length} itens</div>
            <p className={`text-xs mt-1 ${criticalProductsAll.length > 0 ? 'text-red-500 font-medium' : 'text-zinc-500'}`}>
              {criticalProductsAll.length > 0 ? 'Reposição urgente!' : 'Estoque regular'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ÁREA DOS GRÁFICOS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Balanço Financeiro</CardTitle>
            <CardDescription>Evolução de entradas e saídas no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <FinancialChart data={financialChartData} />
          </CardContent>
        </Card>

        <Card className="col-span-3 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Status das Ordens de Serviço</CardTitle>
            <CardDescription>Volume de serviços no período.</CardDescription>
          </CardHeader>
          <CardContent>
            <OSStatusChart data={osChartData} />
          </CardContent>
        </Card>
      </div>

      {/* PAINEL INFERIOR: ÚLTIMAS OS E WIDGET DE STOCK */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4 mb-8">
        <Card className="col-span-4 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Movimentações do Período (OS)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {recentOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma ordem no período.</p>
                </div>
              )}
              {recentOrders.map((os) => (
                <div key={os.id} className="flex items-center justify-between group border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-bold leading-none text-zinc-900">
                      {os.vehicle.brand} {os.vehicle.model} <span className="text-zinc-400 font-normal">({os.vehicle.plate})</span>
                    </p>
                    <p className="text-xs text-zinc-500">Cliente: {os.customer.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="font-bold text-sm text-zinc-900">{formatBRL(os.total)}</div>
                    {getStatusBadge(os.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`col-span-3 transition-all duration-300 hover:shadow-md ${topCriticalProducts.length > 0 ? 'border-red-100 bg-red-50/10' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${topCriticalProducts.length > 0 ? 'text-red-500' : 'text-zinc-400'}`} />
              Painel de Compras (Falta de Estoque)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCriticalProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-emerald-500">
                  <CheckCircle2 className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm font-bold">O estoque está saudável!</p>
                </div>
              ) : (
                topCriticalProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between group border-b border-zinc-200 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 truncate max-w-[160px]" title={p.name}>{p.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Ref: {p.sku || 'S/N'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Mín: {p.minStock}</p>
                        <Badge variant="destructive" className="font-bold text-xs bg-red-600 hover:bg-red-700">{p.stock} unid.</Badge>
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50">
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}