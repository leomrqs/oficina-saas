// app/dashboard/financeiro/ClientFinanceManager.tsx
"use client";

import { useState } from "react";
import { Search, Plus, Trash2, CheckCircle, ArrowUpCircle, ArrowDownCircle, Calendar, Zap, FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransaction, markAsPaid, deleteTransaction, createFixedExpense, deleteFixedExpense, generateMonthlyFixedExpenses } from "@/actions/finance";
import { toast } from "sonner";

export function ClientFinanceManager({ transactions, fixedExpenses }: { transactions: any[], fixedExpenses: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState<"INCOME" | "EXPENSE" | "FIXED" | null>(null);

  const filteredData = transactions
    .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const incomeCategories = ["Serviços Realizados", "Venda de Peças", "Adiantamentos", "Outras Receitas"];
  const expenseCategories = ["Fornecedores (Peças)", "Aluguel / Infraestrutura", "Funcionários / Mão de Obra", "Impostos e Taxas", "Equipamentos", "Água / Luz / Internet", "Sistemas/SaaS", "Outros Custos"];

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const handleCreate = async (formData: FormData) => {
    try {
      if (openModal === "FIXED") {
        await createFixedExpense(formData);
        toast.success("Conta Fixa cadastrada para a oficina!");
      } else {
        await createTransaction(formData);
        toast.success("Lançamento avulso registrado!");
      }
      setOpenModal(null);
    } catch { toast.error("Erro ao registrar no financeiro."); }
  };

  const handleGenerateFixed = async () => {
    try {
      const count = await generateMonthlyFixedExpenses();
      if (count > 0) {
        toast.success(`${count} contas fixas lançadas com sucesso para o mês atual!`);
      } else {
        toast.info("Todas as contas fixas deste mês já haviam sido lançadas.");
      }
    } catch { toast.error("Erro ao lançar contas mensais."); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por descrição ou categoria..." className="pl-9 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenModal("EXPENSE")} className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/50 dark:hover:bg-red-900/50 shadow-sm">
            <ArrowDownCircle className="mr-2 h-4 w-4" /> Despesa Avulsa
          </Button>
          <Button onClick={() => setOpenModal("INCOME")} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <ArrowUpCircle className="mr-2 h-4 w-4" /> Receita Avulsa
          </Button>
        </div>
      </div>

      <Dialog open={!!openModal} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="max-w-xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800">
          <div className={`p-6 border-b dark:border-zinc-800 text-white ${openModal === 'INCOME' ? 'bg-emerald-600 dark:bg-emerald-700' : openModal === 'FIXED' ? 'bg-purple-600 dark:bg-purple-700' : 'bg-red-600 dark:bg-red-700'}`}>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {openModal === 'INCOME' && <><ArrowUpCircle/> Nova Receita</>}
              {openModal === 'EXPENSE' && <><ArrowDownCircle/> Nova Despesa Avulsa</>}
              {openModal === 'FIXED' && <><Zap/> Cadastrar Conta Fixa Mensal</>}
            </DialogTitle>
            <p className="text-sm opacity-90 mt-1">
              {openModal === 'FIXED' ? "Essa conta será cobrada todos os meses no dia escolhido." : "Insira os dados do lançamento no caixa."}
            </p>
          </div>
          <form action={handleCreate} className="p-6 space-y-6">
            <input type="hidden" name="type" value={openModal === "FIXED" ? "EXPENSE" : openModal || ""} />
            
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição</label>
                <Input name="title" required placeholder="Ex: Conta de Energia, Aluguel..." className="h-12 text-lg bg-white dark:bg-zinc-900 dark:border-zinc-800" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="h-12 font-bold text-xl text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 dark:border-zinc-800" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</label>
                <Select name="category" required>
                  <SelectTrigger className="h-12 bg-white dark:bg-zinc-900 dark:border-zinc-800"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                    {(openModal === 'INCOME' ? incomeCategories : expenseCategories).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {openModal === 'FIXED' ? (
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Vence todo dia:</label>
                  <Select name="dueDay" required>
                    <SelectTrigger className="h-12 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-300 font-bold"><SelectValue placeholder="Escolha o dia do vencimento" /></SelectTrigger>
                    <SelectContent className="max-h-56 dark:bg-zinc-900 dark:border-zinc-800">
                      {Array.from({length: 31}, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>Todo dia {d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vencimento</label>
                    <Input name="dueDate" type="date" required className="h-12 bg-white dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                    <Select name="status" defaultValue="PENDING">
                      <SelectTrigger className="h-12 bg-white dark:bg-zinc-900 dark:border-zinc-800"><SelectValue/></SelectTrigger>
                      <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                        <SelectItem value="PAID">{openModal === 'INCOME' ? "Já Recebido" : "Já Pago"}</SelectItem>
                        <SelectItem value="PENDING">{openModal === 'INCOME' ? "A Receber" : "A Pagar"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Observações</label>
                    <Textarea name="notes" placeholder="Anotações opcionais..." className="bg-white dark:bg-zinc-900 dark:border-zinc-800 resize-none" />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" className="dark:border-zinc-800" onClick={() => setOpenModal(null)}>Cancelar</Button>
              <Button type="submit" className={`text-white ${openModal === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : openModal === 'FIXED' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Salvar Lançamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6 bg-zinc-200/50 dark:bg-zinc-800/50 p-1">
          <TabsTrigger value="all" className="dark:data-[state=active]:bg-zinc-700">Extrato Geral</TabsTrigger>
          <TabsTrigger value="payable" className="data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 dark:data-[state=active]:bg-zinc-700">A Pagar</TabsTrigger>
          <TabsTrigger value="receivable" className="data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 dark:data-[state=active]:bg-zinc-700">A Receber</TabsTrigger>
          <TabsTrigger value="fixed" className="data-[state=active]:text-purple-600 bg-purple-100/50 dark:bg-purple-900/20 dark:data-[state=active]:bg-zinc-700"><Zap className="w-3 h-3 mr-1"/> Contas Fixas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <TransactionTable transactions={filteredData} today={today} handlePay={markAsPaid} handleDelete={deleteTransaction} formatBRL={formatBRL} formatDate={formatDate} />
        </TabsContent>

        <TabsContent value="payable" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <TransactionTable transactions={filteredData.filter(t => t.type === "EXPENSE" && t.status === "PENDING")} today={today} handlePay={markAsPaid} handleDelete={deleteTransaction} formatBRL={formatBRL} formatDate={formatDate} emptyMsg="Nenhuma conta pendente para pagar!" />
        </TabsContent>

        <TabsContent value="receivable" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <TransactionTable transactions={filteredData.filter(t => t.type === "INCOME" && t.status === "PENDING")} today={today} handlePay={markAsPaid} handleDelete={deleteTransaction} formatBRL={formatBRL} formatDate={formatDate} emptyMsg="Nenhum valor pendente para receber!" />
        </TabsContent>

        <TabsContent value="fixed">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-zinc-900">
              <div>
                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-600 dark:text-purple-400"/> Centro de Contas Mensais</h3>
                <p className="text-sm text-purple-700/70 dark:text-purple-400/70">Cadastre o aluguel, internet e contador aqui. Todo mês clique no botão ao lado para jogar pro extrato.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-purple-200 text-purple-700 bg-white hover:bg-purple-100 dark:bg-zinc-900 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-950/30" onClick={() => setOpenModal("FIXED")}>
                  <Plus className="w-4 h-4 mr-2"/> Nova Fixa
                </Button>
                <Button onClick={handleGenerateFixed} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                  <FileOutput className="w-4 h-4 mr-2"/> Lançar Contas deste Mês
                </Button>
              </div>
            </div>
            
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50">
                <TableRow className="dark:border-zinc-800">
                  <TableHead className="w-[120px] dark:text-zinc-400">Dia do Venc.</TableHead>
                  <TableHead className="dark:text-zinc-400">Título e Categoria</TableHead>
                  <TableHead className="text-right dark:text-zinc-400">Valor Fixo</TableHead>
                  <TableHead className="text-right w-[80px] dark:text-zinc-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedExpenses.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-zinc-500 dark:text-zinc-400">Nenhuma despesa fixa configurada. Adicione aluguel, luz, internet...</TableCell></TableRow>
                )}
                {fixedExpenses.map((f: any) => (
                  <TableRow key={f.id} className="group hover:bg-purple-50/30 dark:hover:bg-purple-950/20 dark:border-zinc-800">
                    <TableCell>
                      <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-900/50 dark:text-purple-400">Todo dia {f.dueDay}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{f.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{f.category}</p>
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600 dark:text-red-400">{formatBRL(f.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400" onClick={async () => { if(confirm("Excluir conta fixa?")) await deleteFixedExpense(f.id) }}>
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-componente (Evita repetição)
function TransactionTable({ transactions, today, handlePay, handleDelete, formatBRL, formatDate, emptyMsg = "Nenhum lançamento encontrado." }: any) {
  return (
    <Table>
      <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50">
        <TableRow className="dark:border-zinc-800">
          <TableHead className="w-[120px] dark:text-zinc-400">Vencimento</TableHead>
          <TableHead className="dark:text-zinc-400">Descrição & Categoria</TableHead>
          <TableHead className="text-center dark:text-zinc-400">Status</TableHead>
          <TableHead className="text-right dark:text-zinc-400">Valor</TableHead>
          <TableHead className="text-right w-[100px] dark:text-zinc-400">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 && (
          <TableRow><TableCell colSpan={5} className="text-center py-12 text-zinc-500 dark:text-zinc-400">{emptyMsg}</TableCell></TableRow>
        )}
        {transactions.map((t: any) => {
          const isLate = t.status === "PENDING" && new Date(t.dueDate).getTime() < today.getTime();
          
          return (
            <TableRow key={t.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:border-zinc-800">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isLate ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`} />
                  <span className={`font-medium ${isLate ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-600 dark:text-zinc-300'}`}>{formatDate(t.dueDate)}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  {t.type === "INCOME" ? <ArrowUpCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400"/> : <ArrowDownCircle className="w-5 h-5 text-red-500 dark:text-red-400"/>}
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{t.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.category}</p>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-center">
                {t.status === "PAID" 
                  ? <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 font-normal">Liquidado</Badge>
                  : isLate 
                    ? <Badge variant="destructive" className="font-bold">Atrasado</Badge>
                    : <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">A Vencer</Badge>
                }
              </TableCell>

              <TableCell className={`text-right font-bold text-base ${t.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                {t.type === "INCOME" ? "+" : "-"} {formatBRL(t.amount)}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {t.status === "PENDING" && (
                    <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30" onClick={() => handlePay(t.id)} title="Marcar como Pago">
                      <CheckCircle className="w-5 h-5"/>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400" onClick={async () => { if(confirm("Apagar registro permanentemente?")) await handleDelete(t.id) }}>
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