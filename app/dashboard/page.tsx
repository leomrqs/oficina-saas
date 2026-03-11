// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Wrench, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 15.231,89</div>
            <p className="text-xs text-zinc-500">+20.1% em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos Abertos</CardTitle>
            <FileText className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-zinc-500">4 aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Hoje</CardTitle>
            <Wrench className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-zinc-500">3 finalizados</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Estoque Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3 itens</div>
            <p className="text-xs text-red-500">Precisam de reposição urgente</p>
          </CardContent>
        </Card>
      </div>

      {/* ÁREA FUTURA PARA O GRÁFICO (Tremor) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Visão Geral Financeira</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 flex items-center justify-center h-[300px] text-zinc-500 border-dashed border-2 m-4 rounded-md">
            Gráfico Tremor entrará aqui
          </CardContent>
        </Card>

        <Card className="col-span-3 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Últimas Ordens de Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Fake list para dar volume ao layout por enquanto */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Troca de Catalisador (Honda Civic)</p>
                    <p className="text-sm text-zinc-500">Cliente: João Silva</p>
                  </div>
                  <div className="ml-auto font-medium">R$ 850,00</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}