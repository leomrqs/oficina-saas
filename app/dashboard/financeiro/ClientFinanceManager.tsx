// app/dashboard/financeiro/ClientFinanceManager.tsx
"use client";

import { useState } from "react";
import { Search, Plus, Trash2, CheckCircle, ArrowUpCircle, ArrowDownCircle, AlertCircle, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransaction, markAsPaid, deleteTransaction } from "@/actions/finance";
import { toast } from "sonner";

export function ClientFinanceManager({ transactions }: { transactions: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState<"INCOME" | "EXPENSE" | null>(null);

  // Filtragem (Pesquisa + Ordenação por data mais próxima)
  const filteredData = transactions
    .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Lógica de Categorias por Tipo
  const incomeCategories = ["Serviços Realizados", "Venda de Peças", "Adiantamentos", "Outras Receitas"];
  const expenseCategories = ["Fornecedores (Peças)", "Aluguel / Infraestrutura", "Funcionários / Mão de Obra", "Impostos e Taxas", "Equipamentos", "Água / Luz / Internet", "Outros Custos"];

  // Funções de formatar
  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // Garante que a data não sofra shift de fuso horário na tela
  };

  const handleCreate = async (formData: FormData) => {
    try {
      await createTransaction(formData);
      toast.success("Lançamento financeiro registrado com sucesso!");
      setOpenModal(null);
    } catch { toast.error("Erro ao registrar lançamento."); }
  };

  const handlePay = async (id: string) => {
    try {
      await markAsPaid(id);
      toast.success("Status atualizado para Pago/Recebido!");
    } catch { toast.error("Erro ao atualizar status."); }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Deseja apagar este registro financeiro permanentemente? Isso pode afetar o balanço.")) return;
    try {
      await deleteTransaction(id);
      toast.success("Registro removido do extrato.");
    } catch { toast.error("Erro ao remover registro."); }
  };

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR DE AÇÕES (Nova Receita / Nova Despesa) */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por descrição ou categoria..." className="pl-9 bg-white shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenModal("EXPENSE")} className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 shadow-sm">
            <ArrowDownCircle className="mr-2 h-4 w-4" /> Registrar Despesa
          </Button>
          <Button onClick={() => setOpenModal("INCOME")} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <ArrowUpCircle className="mr-2 h-4 w-4" /> Registrar Receita
          </Button>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO FINANCEIRA */}
      <Dialog open={!!openModal} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="max-w-xl bg-zinc-50 p-0 overflow-hidden border-zinc-200">
          <div className={`p-6 border-b text-white ${openModal === 'INCOME' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {openModal === 'INCOME' ? <><ArrowUpCircle/> Nova Receita (Entrada)</> : <><ArrowDownCircle/> Nova Despesa (Saída)</>}
            </DialogTitle>
            <p className="text-sm opacity-90 mt-1">Insira os dados do lançamento no caixa.</p>
          </div>
          <form action={handleCreate} className="p-6 space-y-6">
            <input type="hidden" name="type" value={openModal || ""} />
            
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição / Título</label>
                <Input name="title" required placeholder={openModal === 'INCOME' ? "Ex: Adiantamento OS #1005" : "Ex: Compra de Óleo Fornecedor X"} className="h-12 text-lg bg-white" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="h-12 font-bold text-xl text-zinc-900 bg-white" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</label>
                <Select name="category" required>
                  <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {(openModal === 'INCOME' ? incomeCategories : expenseCategories).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Data de Vencimento</label>
                <Input name="dueDate" type="date" required className="h-12 bg-white" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status do Lançamento</label>
                <Select name="status" defaultValue="PENDING">
                  <SelectTrigger className="h-12 bg-white"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">{openModal === 'INCOME' ? "Já Recebido" : "Já Pago"}</SelectItem>
                    <SelectItem value="PENDING">{openModal === 'INCOME' ? "A Receber (Pendente)" : "A Pagar (Pendente)"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Observações</label>
              <Textarea name="notes" placeholder="Anotações opcionais..." className="bg-white resize-none" />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenModal(null)}>Cancelar</Button>
              <Button type="submit" className={openModal === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}>
                Salvar Lançamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PAINEL DE ABAS (EXTRATO / A PAGAR / A RECEBER) */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-3 mb-6 bg-zinc-200/50 p-1">
          <TabsTrigger value="all">Extrato Geral</TabsTrigger>
          <TabsTrigger value="payable" className="data-[state=active]:text-red-600">A Pagar</TabsTrigger>
          <TabsTrigger value="receivable" className="data-[state=active]:text-emerald-600">A Receber</TabsTrigger>
        </TabsList>

        {/* ABA: TODAS AS TRANSAÇÕES */}
        <TabsContent value="all" className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <TransactionTable transactions={filteredData} today={today} handlePay={handlePay} handleDelete={handleDelete} formatBRL={formatBRL} formatDate={formatDate} />
        </TabsContent>

        {/* ABA: CONTAS A PAGAR (APENAS SAÍDAS PENDENTES) */}
        <TabsContent value="payable" className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <TransactionTable 
            transactions={filteredData.filter(t => t.type === "EXPENSE" && t.status === "PENDING")} 
            today={today} handlePay={handlePay} handleDelete={handleDelete} formatBRL={formatBRL} formatDate={formatDate} 
            emptyMsg="Nenhuma conta pendente para pagar!" 
          />
        </TabsContent>

        {/* ABA: CONTAS A RECEBER (APENAS ENTRADAS PENDENTES) */}
        <TabsContent value="receivable" className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <TransactionTable 
            transactions={filteredData.filter(t => t.type === "INCOME" && t.status === "PENDING")} 
            today={today} handlePay={handlePay} handleDelete={handleDelete} formatBRL={formatBRL} formatDate={formatDate} 
            emptyMsg="Nenhum valor pendente para receber!" 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-componente para não repetir a tabela três vezes
function TransactionTable({ transactions, today, handlePay, handleDelete, formatBRL, formatDate, emptyMsg = "Nenhum lançamento encontrado." }: any) {
  return (
    <Table>
      <TableHeader className="bg-zinc-50/50">
        <TableRow>
          <TableHead className="w-[120px]">Vencimento</TableHead>
          <TableHead>Descrição & Categoria</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-right w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 && (
          <TableRow><TableCell colSpan={5} className="text-center py-12 text-zinc-500">{emptyMsg}</TableCell></TableRow>
        )}
        {transactions.map((t: any) => {
          const isLate = t.status === "PENDING" && new Date(t.dueDate).getTime() < today.getTime();
          
          return (
            <TableRow key={t.id} className="group hover:bg-zinc-50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isLate ? 'text-red-500' : 'text-zinc-400'}`} />
                  <span className={`font-medium ${isLate ? 'text-red-600 font-bold' : 'text-zinc-600'}`}>{formatDate(t.dueDate)}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  {t.type === "INCOME" ? <ArrowUpCircle className="w-5 h-5 text-emerald-500"/> : <ArrowDownCircle className="w-5 h-5 text-red-500"/>}
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">{t.title}</p>
                    <p className="text-xs text-zinc-500">{t.category}</p>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-center">
                {t.status === "PAID" 
                  ? <Badge className="bg-zinc-100 text-zinc-600 hover:bg-zinc-100 font-normal">Liquidado</Badge>
                  : isLate 
                    ? <Badge variant="destructive" className="font-bold">Atrasado</Badge>
                    : <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">A Vencer</Badge>
                }
              </TableCell>

              <TableCell className={`text-right font-bold text-base ${t.type === "INCOME" ? "text-emerald-600" : "text-zinc-900"}`}>
                {t.type === "INCOME" ? "+" : "-"} {formatBRL(t.amount)}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {t.status === "PENDING" && (
                    <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => handlePay(t.id)} title="Marcar como Pago/Recebido">
                      <CheckCircle className="w-5 h-5"/>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(t.id)} title="Excluir Transação">
                    <Trash2 className="w-4 h-4"/>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}