// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, FileText, Wrench, AlertTriangle, Building, ArrowUpRight, ArrowDownRight, ShoppingCart, CheckCircle2, User, CalendarClock, ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FinancialChart, OSStatusChart } from "./DashboardCharts";
import { Button } from "@/components/ui/button";
import { DashboardFilter } from "./DashboardFilter";
import { PlanDonutChart, TenantGrowthChart } from "./SaasDashboardCharts";
import { TenantStatusToggle } from "./TenantStatusToggle";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ from?: string, to?: string, osOrder?: string }> }) {
  const session = await getServerSession(authOptions);
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const tenantId = session?.user?.tenantId;

  if (isSuperAdmin || !tenantId) {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [allTenants, totalOrders, newThisMonth, newLastMonth] = await Promise.all([
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, cnpj: true, isActive: true,
          saasPlan: true, saasPrice: true, createdAt: true,
        },
      }),
      prisma.order.count(),
      prisma.tenant.count({ where: { createdAt: { gte: startOfThisMonth } } }),
      prisma.tenant.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    ]);

    const activeTenants = allTenants.filter((t) => t.isActive);
    const blockedTenants = allTenants.filter((t) => !t.isActive);
    const mrr = activeTenants.reduce((sum, t) => sum + t.saasPrice, 0);
    const arr = mrr * 12;

    // Plan distribution
    const planMap = new Map<string, { count: number; revenue: number }>();
    activeTenants.forEach((t) => {
      const cur = planMap.get(t.saasPlan) ?? { count: 0, revenue: 0 };
      planMap.set(t.saasPlan, { count: cur.count + 1, revenue: cur.revenue + t.saasPrice });
    });
    const planData = Array.from(planMap.entries()).map(([name, v]) => ({ name, ...v }));

    // Last 6 months growth
    const growthData: { name: string; oficinas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await prisma.tenant.count({ where: { createdAt: { gte: d, lte: end } } });
      const label = d.toLocaleString("pt-BR", { month: "short" });
      growthData.push({ name: label.charAt(0).toUpperCase() + label.slice(1), oficinas: count });
    }

    const growthDiff = newThisMonth - newLastMonth;
    const formatBRLSaaS = (val: number) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Painel SaaS</h2>
            <p className="text-zinc-500 text-sm mt-1">Visão consolidada de todas as oficinas.</p>
          </div>
          <Link href="/dashboard/oficinas">
            <Button size="sm" className="gap-2">
              <Building className="w-4 h-4" />
              Gerenciar Oficinas
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBRLSaaS(mrr)}</div>
              <p className="text-xs text-zinc-500 mt-1">Receita mensal recorrente</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARR Projetado</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBRLSaaS(arr)}</div>
              <p className="text-xs text-zinc-500 mt-1">MRR × 12 meses</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-violet-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Oficinas Ativas</CardTitle>
              <Building className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTenants.length}</div>
              <p className="text-xs text-zinc-500 mt-1">de {allTenants.length} cadastradas</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${blockedTenants.length > 0 ? "border-l-red-500" : "border-l-zinc-300"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bloqueadas</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${blockedTenants.length > 0 ? "text-red-500" : "text-zinc-400"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${blockedTenants.length > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                {blockedTenants.length}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {blockedTenants.length > 0 ? "Requerem atenção" : "Todas regulares"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newThisMonth}</div>
              <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${growthDiff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {growthDiff >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(growthDiff)} vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Plano</CardTitle>
              <CardDescription>Oficinas ativas por tipo de contrato.</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanDonutChart data={planData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crescimento Mensal</CardTitle>
              <CardDescription>Novas oficinas cadastradas nos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent>
              <TenantGrowthChart data={growthData} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Tenants with quick actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b dark:border-zinc-800 pb-4">
            <div>
              <CardTitle>Oficinas Recentes</CardTitle>
              <CardDescription className="mt-1">Últimas cadastradas — ações rápidas disponíveis.</CardDescription>
            </div>
            <Link href="/dashboard/oficinas">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 dark:text-blue-400">
                Ver todas <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y dark:divide-zinc-800">
              {allTenants.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md shrink-0">
                      <Building className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.cnpj || "CNPJ não informado"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-500 hidden sm:block">
                      {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    <Badge variant="outline" className="text-xs hidden md:inline-flex">{t.saasPlan}</Badge>
                    <Badge
                      variant="outline"
                      className={
                        t.isActive
                          ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-xs"
                          : "text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 text-xs"
                      }
                    >
                      {t.isActive ? "Ativa" : "Bloqueada"}
                    </Badge>
                    <TenantStatusToggle tenantId={t.id} isActive={t.isActive} />
                  </div>
                </div>
              ))}
              {allTenants.length === 0 && (
                <div className="py-10 text-center text-zinc-400 text-sm">
                  Nenhuma oficina cadastrada ainda.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const params = await searchParams;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { billingCycleDay: true }
  });

  const cycleDay = tenant?.billingCycleDay || 1;
  const now = new Date();

  // ============================================================================
  // 🧠 LÓGICA DE CICLO FINANCEIRO (Servidor)
  // ============================================================================
  let startDate = new Date(now.getFullYear(), now.getMonth(), cycleDay, 0, 0, 0); 
  let endDate = new Date(now.getFullYear(), now.getMonth() + 1, cycleDay - 1, 23, 59, 59, 999);

  if (now.getDate() < cycleDay) {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, cycleDay, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), cycleDay - 1, 23, 59, 59, 999);
  }

  // Prepara strings blindadas contra Fuso Horário para mandar para o Calendário
  const formatLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const defaultFromStr = formatLocal(startDate);
  const defaultToStr = formatLocal(endDate);

  // Se usuário filtrou manualmente pela URL
  if (params?.from && params?.to) {
    startDate = new Date(`${params.from}T00:00:00`);
    endDate = new Date(`${params.to}T23:59:59`);
  }

  const diffTime = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - diffTime - 1);
  const prevEndDate = new Date(startDate.getTime() - 1);

  // ============================================================================
  // BUSCAS (QUERIES) NO BANCO DE DADOS
  // ============================================================================
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

  const pendingOrdersCount = await prisma.order.count({
    where: { tenantId, status: "PENDING", createdAt: { gte: startDate, lte: endDate } }
  });

  const servicesInPeriodCount = await prisma.order.count({
    where: { tenantId, updatedAt: { gte: startDate, lte: endDate }, status: { in: ["APPROVED", "COMPLETED"] } }
  });

  // Apenas Peças Físicas no Estoque Crítico
  const physicalProducts = await prisma.product.findMany({
    where: { tenantId, isService: false }, 
    select: { id: true, name: true, sku: true, stock: true, minStock: true }
  });
  const criticalProductsAll = physicalProducts.filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock);
  const topCriticalProducts = criticalProductsAll.slice(0, 6);

  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId, paymentDate: { gte: startDate, lte: endDate }, status: "PAID" },
    select: { amount: true, type: true, paymentDate: true }
  });

  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const groupBy = diffDays <= 35 ? 'day' : 'month';
  const dataMap = new Map();

  if (groupBy === 'day') {
    for(let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
       const key = formatLocal(d).split('-').reverse().slice(0,2).join('/'); // MM/DD -> DD/MM
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
    if (groupBy === 'day') key = formatLocal(d).split('-').reverse().slice(0,2).join('/');
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

  const osOrderDirection = params?.osOrder === 'asc' ? 'asc' : 'desc';

  const recentOrders = await prisma.order.findMany({
    where: { tenantId, updatedAt: { gte: startDate, lte: endDate } },
    orderBy: { updatedAt: osOrderDirection },
    take: 6,
    include: { customer: { select: { name: true } }, vehicle: { select: { plate: true, brand: true, model: true } } }
  });

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-500">Orçamento</Badge>;
      case "APPROVED": return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">Em Serviço</Badge>;
      case "COMPLETED": return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">Finalizado</Badge>;
      case "CANCELED": return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const currentQuery = new URLSearchParams();
  if (params?.from) currentQuery.set("from", params.from);
  if (params?.to) currentQuery.set("to", params.to);
  const toggleOrder = osOrderDirection === 'desc' ? 'asc' : 'desc';
  currentQuery.set("osOrder", toggleOrder);

  return (
    <>
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visão Geral da Oficina</h2>
          <p className="text-zinc-500 text-sm">Acompanhe os resultados e métricas do seu ciclo contábil.</p>
        </div>
      </div>

      <DashboardFilter cycleDay={cycleDay} defaultFrom={defaultFromStr} defaultTo={defaultToStr} />

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
            <CardTitle className="text-sm font-medium">Orçamentos Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrdersCount}</div>
            <p className="text-xs text-zinc-500 mt-1">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços no Pátio</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servicesInPeriodCount}</div>
            <p className="text-xs text-zinc-500 mt-1">Em serviço ou concluídos</p>
          </CardContent>
        </Card>

        <Card className={`transition-all duration-300 hover:shadow-md border-l-4 ${criticalProductsAll.length > 0 ? 'border-l-red-500 bg-red-50/30 dark:bg-red-950/20' : 'border-l-zinc-300'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${criticalProductsAll.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`}>Risco de Ruptura</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${criticalProductsAll.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalProductsAll.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>{criticalProductsAll.length} peças</div>
            <p className={`text-xs mt-1 ${criticalProductsAll.length > 0 ? 'text-red-500 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
              {criticalProductsAll.length > 0 ? 'Reposição urgente!' : 'Estoque regular'}
            </p>
          </CardContent>
        </Card>
      </div>

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
            <CardTitle>Status do Pátio</CardTitle>
            <CardDescription>Volume de serviços no ciclo.</CardDescription>
          </CardHeader>
          <CardContent>
            <OSStatusChart data={osChartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4 mb-8">
        <Card className="col-span-4 transition-all duration-300 hover:shadow-md flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b dark:border-zinc-800 pb-4">
            <div>
              <CardTitle>Últimas Modificações de OS</CardTitle>
              <CardDescription className="mt-1">Acompanhe a fila de serviços no salão.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`?${currentQuery.toString()}`}>
                <Button variant="outline" size="sm" className="h-8 text-xs px-2 dark:border-zinc-700">
                  {osOrderDirection === 'desc' ? <ArrowDown className="w-3 h-3 mr-1 text-blue-500"/> : <ArrowUp className="w-3 h-3 mr-1 text-blue-500"/>}
                  {osOrderDirection === 'desc' ? "Mais Recentes" : "Mais Antigas"}
                </Button>
              </Link>
              <Link href="/dashboard/os">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 px-2">
                  Ver Todas <ExternalLink className="w-3 h-3 ml-1"/>
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <div className="space-y-4">
              {recentOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma ordem neste período.</p>
                </div>
              )}
              {recentOrders.map((os) => (
                <div key={os.id} className="flex flex-col sm:flex-row sm:items-center justify-between group border-b border-zinc-100 dark:border-zinc-800 pb-4 last:border-0 last:pb-0 gap-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-zinc-100 dark:bg-zinc-800/80 p-2 rounded-md shrink-0 flex flex-col items-center justify-center min-w-[56px] border dark:border-zinc-700/50">
                      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">OS</span>
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">#{os.number}</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold leading-none text-zinc-900 dark:text-zinc-100">
                        {os.vehicle.brand} {os.vehicle.model} <span className="text-zinc-400 dark:text-zinc-500 font-normal">({os.vehicle.plate})</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded-sm"><User className="w-3 h-3"/> {os.customer.name}</span>
                        <span className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded-sm"><CalendarClock className="w-3 h-3"/> {new Date(os.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md sm:bg-transparent sm:p-0">
                      {formatBRL(os.total)}
                    </div>
                    {getStatusBadge(os.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`col-span-3 transition-all duration-300 hover:shadow-md flex flex-col ${topCriticalProducts.length > 0 ? 'border-red-100 bg-red-50/10 dark:border-red-900/30 dark:bg-red-950/10' : ''}`}>
          <CardHeader className="border-b dark:border-zinc-800 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${topCriticalProducts.length > 0 ? 'text-red-500 dark:text-red-400' : 'text-zinc-400'}`} />
                Painel de Compras
              </CardTitle>
              <CardDescription className="mt-1">Peças físicas com urgência.</CardDescription>
            </div>
            <Link href="/dashboard/estoque">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                <ShoppingCart className="w-4 h-4"/>
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <div className="space-y-4">
              {topCriticalProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-emerald-500">
                  <CheckCircle2 className="w-10 h-10 mb-3 opacity-80" />
                  <p className="text-sm font-bold">O estoque físico está saudável!</p>
                </div>
              ) : (
                topCriticalProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between group border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[160px] md:max-w-[200px]" title={p.name}>{p.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Ref: {p.sku || 'S/N'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">Mín: {p.minStock}</p>
                        <Badge variant="destructive" className="font-bold text-xs bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600">{p.stock} unid.</Badge>
                      </div>
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