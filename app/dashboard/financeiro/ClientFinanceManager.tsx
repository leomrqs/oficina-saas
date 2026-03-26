// app/dashboard/financeiro/ClientFinanceManager.tsx
"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Trash2, CheckCircle, ArrowUpCircle, ArrowDownCircle, Calendar, Zap, FileOutput, DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle, MessageCircle, User, ChevronLeft, ChevronRight, CreditCard, Banknote, Smartphone, FileText, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTransaction, markAsPaid, deleteTransaction, createFixedExpense, deleteFixedExpense, updateFixedExpense, generateMonthlyFixedExpenses } from "@/actions/finance";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

export function ClientFinanceManager({ transactions, fixedExpenses, employees, tenantConfig }: { transactions: any[], fixedExpenses: any[], employees: any[], tenantConfig: any }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState<"INCOME" | "EXPENSE" | "FIXED" | null>(null);
  const [editingFixed, setEditingFixed] = useState<any | null>(null);
  const [editFixedForm, setEditFixedForm] = useState({ title: "", category: "", amount: "", dueDay: "" });
  const [payingTx, setPayingTx] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  
  // Controle de Ciclo Mensal
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const cycleDay = tenantConfig?.billingCycleDay || 1;

  // Calcula o período exato (Ex: 05/08 a 04/09 se o ciclo for dia 5)
  const periodStart = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), cycleDay, 0, 0, 0), [currentDate, cycleDay]);
  const periodEnd = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, cycleDay - 1, 23, 59, 59), [currentDate, cycleDay]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
    setCurrentPage(1); // Reseta a paginação
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const incomeCategories = ["Serviços/OS", "Venda de Peças Balcão", "Adiantamentos", "Outras Receitas"];
  const costCategories = ["Fornecedores (Peças)", "Terceirização (Retífica/Torno)", "Comissões"]; // Custos Diretos
  const expenseCategories = [...costCategories, "Aluguel/Infraestrutura", "Funcionários / Mão de Obra", "Impostos e Taxas", "Equipamentos", "Água/Luz/Internet", "Sistemas/SaaS", "Outros Custos"];

  // DADOS FILTRADOS PELO CICLO E BUSCA
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.dueDate);
      const matchesPeriod = d >= periodStart && d <= periodEnd;
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.order?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.order?.vehicle?.plate?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesPeriod && matchesSearch;
    });
  }, [transactions, periodStart, periodEnd, searchTerm]);

  // CÁLCULO DO DRE DE CAIXA (Apenas valores Liquidados)
  const dre = useMemo(() => {
    let income = 0;
    let cogs = 0; // Custos Diretos
    let opex = 0; // Despesas Fixas

    let pendingInc = 0;
    let pendingExp = 0;
    let late = 0;
    const now = new Date().getTime();

    periodTransactions.forEach(t => {
      if (t.status === "PAID") {
        if (t.type === "INCOME") income += t.amount;
        else if (costCategories.includes(t.category)) cogs += t.amount;
        else opex += t.amount;
      } else {
        if (t.type === "INCOME") {
          pendingInc += t.amount;
          if (new Date(t.dueDate).getTime() < now) late += t.amount;
        } else {
          pendingExp += t.amount;
        }
      }
    });

    const profit = income - cogs - opex;
    const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : 0;

    return { income, cogs, opex, profit, margin, pendingInc, pendingExp, late };
  }, [periodTransactions]);

  // VERIFICADOR DE ALERTA DE CONTAS FIXAS
  const hasGeneratedFixedThisMonth = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    // Procura alguma transação com a Tag deste mês
    return transactions.some(t => t.notes && (t.notes.includes(`FIXED_EXPENSE_`) || t.notes.includes(`SALARY_EMP_`)) && t.notes.includes(`_${currentMonth}_${currentYear}`));
  }, [transactions, currentDate]);

  const totalFixedExpected = fixedExpenses.length + employees.length;

  const handleCreate = async (formData: FormData) => {
    try {
      if (openModal === "FIXED") {
        await createFixedExpense(formData);
        toast.success("Conta Fixa cadastrada!");
      } else {
        await createTransaction(formData);
        toast.success("Lançamento avulso registrado!");
      }
      setOpenModal(null);
    } catch { toast.error("Erro ao registrar."); }
  };

  const handleGenerateFixed = async () => {
    try {
      const count = await generateMonthlyFixedExpenses(currentDate.getMonth(), currentDate.getFullYear());
      if (count > 0) toast.success(`${count} contas fixas/salários lançados para ${monthNames[currentDate.getMonth()]}!`);
      else toast.info(`As contas de ${monthNames[currentDate.getMonth()]} já haviam sido lançadas.`);
    } catch { toast.error("Erro ao lançar contas."); }
  };

  const handleEditFixed = async (formData: FormData) => {
    if (!editingFixed) return;
    try {
      await updateFixedExpense(editingFixed.id, formData);
      toast.success("Conta fixa atualizada!");
      setEditingFixed(null);
    } catch { toast.error("Erro ao atualizar conta fixa."); }
  };

  const confirmPayment = async () => {
    if (!payingTx) return;
    try {
      await markAsPaid(payingTx, paymentMethod);
      toast.success("Baixa realizada com sucesso!");
      setPayingTx(null);
    } catch { toast.error("Erro ao dar baixa."); }
  };

  const handleWhatsAppCharge = (t: any) => {
    if (!t.order?.customer?.phone) return toast.error("Cliente sem telefone cadastrado.");
    const phone = t.order.customer.phone.replace(/\D/g, '');
    const vehicle = t.order.vehicle ? `${t.order.vehicle.brand} ${t.order.vehicle.model}` : 'veículo';
    const msg = `Olá *${t.order.customer.name}*, tudo bem? \nPassando para lembrar que temos um valor pendente de *${formatBRL(t.amount)}* referente ao serviço do *${vehicle}* (OS #${t.order.number}). \n\nQualquer dúvida, estamos à disposição!`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* SELETOR DE MÊS E BUSCA (Responsividade Aplicada) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border dark:border-zinc-800 shadow-sm">
        
        {/* Controle de Mês */}
        <div className="flex items-center gap-4 w-full xl:w-auto justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border dark:border-zinc-800">
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => changeMonth(-1)}><ChevronLeft className="w-4 h-4"/></Button>
          <div className="text-center px-2">
            <h3 className="font-bold text-sm sm:text-lg text-zinc-900 dark:text-zinc-100 uppercase tracking-wider whitespace-nowrap">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-medium">Ciclo: {formatDate(periodStart)} - {formatDate(periodEnd)}</p>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => changeMonth(1)}><ChevronRight className="w-4 h-4"/></Button>
        </div>

        {/* Busca e Botões */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full xl:w-auto">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input placeholder="Buscar (OS, Cliente, Placa)..." className="pl-9 w-full bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setOpenModal("EXPENSE")} className="flex-1 sm:flex-initial text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/50">
              <ArrowDownCircle className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">Despesa</span>
            </Button>
            <Button onClick={() => setOpenModal("INCOME")} className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white">
              <ArrowUpCircle className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">Receita</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ALERTA GLOBAL */}
      {!hasGeneratedFixedThisMonth && totalFixedExpected > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-500 shrink-0" />
            <div>
              <p className="font-bold text-orange-900 dark:text-orange-400">Atenção ao Caixa deste Mês!</p>
              <p className="text-sm text-orange-800 dark:text-orange-500/80">Existem {totalFixedExpected} contas/salários que ainda não foram lançados no "A Pagar" neste ciclo.</p>
            </div>
          </div>
          <Button onClick={handleGenerateFixed} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-sm whitespace-nowrap">
            Lançar Contas Agora
          </Button>
        </div>
      )}

      {/* MODAL DE NOVO LANÇAMENTO (Responsividade Aplicada) */}
      <Dialog open={!!openModal} onOpenChange={(open) => !open && setOpenModal(null)}>
        <DialogContent className="w-[95vw] max-w-xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className={`p-5 border-b dark:border-zinc-800 text-white ${openModal === 'INCOME' ? 'bg-emerald-600 dark:bg-emerald-700' : openModal === 'FIXED' ? 'bg-purple-600 dark:bg-purple-700' : 'bg-red-600 dark:bg-red-700'}`}>
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              {openModal === 'INCOME' && <><ArrowUpCircle/> Nova Receita Avulsa</>}
              {openModal === 'EXPENSE' && <><ArrowDownCircle/> Nova Despesa Avulsa</>}
              {openModal === 'FIXED' && <><Zap/> Nova Conta Fixa / Assinatura</>}
            </DialogTitle>
          </div>
          <form action={handleCreate} className="p-5 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
            <input type="hidden" name="type" value={openModal === "FIXED" ? "EXPENSE" : openModal || ""} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição</label>
                <Input name="title" required placeholder="Ex: Conta de Energia, Aluguel..." className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="h-12 font-bold text-lg sm:text-xl dark:bg-zinc-900 dark:border-zinc-800" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria (DRE)</label>
                <Select name="category" required>
                  <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                    {(openModal === 'INCOME' ? incomeCategories : expenseCategories).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {openModal === 'FIXED' ? (
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Vence todo dia:</label>
                  <Select name="dueDay" required>
                    <SelectTrigger className="h-12 bg-purple-50 dark:bg-purple-950/30 border-purple-200 text-purple-900 font-bold"><SelectValue placeholder="Escolha o dia" /></SelectTrigger>
                    <SelectContent className="max-h-56 dark:bg-zinc-900 dark:border-zinc-800">
                      {Array.from({length: 31}, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>Todo dia {d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vencimento</label>
                    <Input name="dueDate" type="date" required className="h-12 dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark] w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                    <Select name="status" defaultValue="PENDING">
                      <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800"><SelectValue/></SelectTrigger>
                      <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                        <SelectItem value="PAID">{openModal === 'INCOME' ? "Já Recebido" : "Já Pago"}</SelectItem>
                        <SelectItem value="PENDING">{openModal === 'INCOME' ? "A Receber" : "A Pagar"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpenModal(null)}>Cancelar</Button>
              <Button type="submit" className={`w-full sm:w-auto text-white ${openModal === 'INCOME' ? 'bg-emerald-600' : openModal === 'FIXED' ? 'bg-purple-600' : 'bg-red-600'}`}>Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE BAIXA (Meio de Pagamento) */}
      <Dialog open={!!payingTx} onOpenChange={(open) => !open && setPayingTx(null)}>
        <DialogContent className="w-[90vw] max-w-sm dark:bg-zinc-950 dark:border-zinc-800 rounded-xl">
          <DialogHeader><DialogTitle className="dark:text-white text-xl">Confirmar Baixa</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Qual foi o meio de pagamento utilizado?</p>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                <SelectItem value="PIX"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-500"/> PIX</div></SelectItem>
                <SelectItem value="CREDITO"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-500"/> Cartão de Crédito</div></SelectItem>
                <SelectItem value="DEBITO"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-orange-500"/> Cartão de Débito</div></SelectItem>
                <SelectItem value="DINHEIRO"><div className="flex items-center gap-2"><Banknote className="w-4 h-4 text-green-600"/> Dinheiro / Espécie</div></SelectItem>
                <SelectItem value="BOLETO"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-zinc-500"/> Boleto Bancário</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setPayingTx(null)}>Cancelar</Button>
            <Button onClick={confirmPayment} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* MODAL DE EDIÇÃO DE CONTA FIXA */}
      <Dialog open={!!editingFixed} onOpenChange={(open) => !open && setEditingFixed(null)}>
        <DialogContent className="w-[95vw] max-w-xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="p-5 border-b dark:border-zinc-800 text-white bg-purple-600 dark:bg-purple-700">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Pencil /> Editar Conta Fixa
            </DialogTitle>
          </div>
          <form action={handleEditFixed} className="p-5 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição</label>
                <Input name="title" required defaultValue={editingFixed?.title} className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                <Input name="amount" type="number" step="0.01" required defaultValue={editingFixed?.amount} className="h-12 font-bold text-lg sm:text-xl dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria (DRE)</label>
                <Select name="category" required defaultValue={editingFixed?.category}>
                  <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                    {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Vence todo dia:</label>
                <Select name="dueDay" required defaultValue={editingFixed?.dueDay?.toString()}>
                  <SelectTrigger className="h-12 bg-purple-50 dark:bg-purple-950/30 border-purple-200 text-purple-900 font-bold"><SelectValue placeholder="Escolha o dia" /></SelectTrigger>
                  <SelectContent className="max-h-56 dark:bg-zinc-900 dark:border-zinc-800">
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>Todo dia {d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              Lançamentos passados não serão alterados. Apenas futuros gerados usarão o novo valor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setEditingFixed(null)}>Cancelar</Button>
              <Button type="submit" className="w-full sm:w-auto text-white bg-purple-600 hover:bg-purple-700">Salvar Alterações</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ABAS DO SISTEMA (Scroll Horizontal no Mobile Aplicado) */}
      <Tabs defaultValue="dashboard" className="w-full" onValueChange={() => setCurrentPage(1)}>
        <div className="w-full overflow-x-auto hide-scrollbar mb-6 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-1">
          <TabsList className="flex w-max min-w-full justify-start md:justify-center bg-transparent">
            <TabsTrigger value="dashboard" className="dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">DRE / Resumo</TabsTrigger>
            <TabsTrigger value="receivable" className="data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">A Receber</TabsTrigger>
            <TabsTrigger value="payable" className="data-[state=active]:text-red-600 dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">A Pagar</TabsTrigger>
            <TabsTrigger value="all" className="dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">Extrato (Caixa)</TabsTrigger>
            <TabsTrigger value="fixed" className="data-[state=active]:text-purple-600 dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">Contas Fixas/RH</TabsTrigger>
          </TabsList>
        </div>

        {/* ABA: DASHBOARD (DRE) */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Meta Mensal de Faturamento</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatBRL(dre.income)} / {formatBRL(tenantConfig?.monthlyGoal || 1)}</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div className="bg-blue-600 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min((dre.income / (tenantConfig?.monthlyGoal || 1)) * 100, 100)}%` }}></div>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-500 uppercase tracking-wider mb-2">Receita Bruta (Entrou)</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">{formatBRL(dre.income)}</p>
            </div>
            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-red-800 dark:text-red-500 uppercase tracking-wider mb-2">Custos Diretos (Peças)</p>
              <p className="text-2xl sm:text-3xl font-black text-red-700 dark:text-red-400">{formatBRL(dre.cogs)}</p>
            </div>
            <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-orange-800 dark:text-orange-500 uppercase tracking-wider mb-2">Despesas Fixas / RH</p>
              <p className="text-2xl sm:text-3xl font-black text-orange-700 dark:text-orange-400">{formatBRL(dre.opex)}</p>
            </div>
            <div className={`p-5 rounded-xl border ${dre.profit >= 0 ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-800' : 'bg-gradient-to-br from-red-900 to-red-800 border-red-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Lucro Líquido</p>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[9px] sm:text-[10px]">{dre.margin}% Margem</Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{formatBRL(dre.profit)}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">A Receber (No Ciclo)</p>
                <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatBRL(dre.pendingInc)}</p>
              </div>
              {dre.late > 0 && (
                <div className="text-right">
                  <p className="text-[9px] sm:text-[10px] font-bold text-red-500 uppercase">Atrasado</p>
                  <p className="text-lg sm:text-xl font-black text-red-600 dark:text-red-500">{formatBRL(dre.late)}</p>
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">A Pagar (No Ciclo)</p>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatBRL(dre.pendingExp)}</p>
            </div>
          </div>
        </TabsContent>

        {/* COMPONENTES DE TABELA GERADOS DINAMICAMENTE */}
        <TabsContent value="receivable" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <TransactionTable 
            transactions={periodTransactions.filter(t => t.type === "INCOME" && t.status === "PENDING")} 
            today={currentDate} setPayingTx={setPayingTx} handleDelete={deleteTransaction} formatBRL={formatBRL} formatDate={formatDate} handleWhatsApp={handleWhatsAppCharge} emptyMsg="Tudo em dia! Nenhum recebimento pendente."
            currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage}
          />
        </TabsContent>

        <TabsContent value="payable" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <TransactionTable 
            transactions={periodTransactions.filter(t => t.type === "EXPENSE" && t.status === "PENDING")} 
            today={currentDate} setPayingTx={setPayingTx} handleDelete={deleteTransaction} formatBRL={formatBRL} formatDate={formatDate} emptyMsg="Caixa no azul! Nenhuma despesa pendente."
            currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage}
          />
        </TabsContent>

        <TabsContent value="all" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <TransactionTable 
            transactions={periodTransactions.filter(t => t.status === "PAID").sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())} 
            today={currentDate} setPayingTx={setPayingTx} handleDelete={deleteTransaction} formatBRL={formatBRL} formatDate={formatDate} emptyMsg="Nenhuma movimentação liquidada neste ciclo."
            currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} isExtrato={true}
          />
        </TabsContent>

        <TabsContent value="fixed">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 sm:p-6 border-b dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-zinc-900">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-600"/> Centro de Contas e RH</h3>
                <p className="text-[11px] sm:text-sm text-purple-700/70 dark:text-purple-400/70 mt-1">O sistema lê isso e joga pro "A Pagar" sozinho.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" className="border-purple-200 text-purple-700 bg-white dark:bg-zinc-900 w-full sm:w-auto" onClick={() => setOpenModal("FIXED")}>
                  <Plus className="w-4 h-4 mr-2"/> Nova Fixa
                </Button>
                <Button onClick={handleGenerateFixed} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md w-full sm:w-auto">
                  <FileOutput className="w-4 h-4 mr-2"/> Lançar Neste Ciclo
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
                  <TableRow className="dark:border-zinc-800">
                    <TableHead className="w-[100px]">Vencimento</TableHead>
                    <TableHead>Título e Categoria</TableHead>
                    <TableHead className="text-right">Valor Fixo</TableHead>
                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Renderiza Funcionários como Contas Fixas de Leitura */}
                  {employees.map(emp => (
                    <TableRow key={`emp-${emp.id}`} className="bg-zinc-50/30 dark:bg-zinc-900/30 dark:border-zinc-800 opacity-80">
                      <TableCell><Badge variant="outline" className="bg-white dark:bg-zinc-900 whitespace-nowrap">Dia {emp.payDay}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <HardHat className="w-4 h-4 text-zinc-400 shrink-0" />
                          <div>
                            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Salário: {emp.name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">RH Automatizado</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600/80 dark:text-red-400/80 whitespace-nowrap">{formatBRL(emp.salary)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" disabled className="text-[10px]">Puxado do RH</Button></TableCell>
                    </TableRow>
                  ))}
                  {/* Renderiza Contas Fixas Reais */}
                  {fixedExpenses.map((f: any) => (
                    <TableRow key={f.id} className="dark:border-zinc-800">
                      <TableCell><Badge variant="outline" className="text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 whitespace-nowrap">Dia {f.dueDay}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{f.title}</p>
                        <p className="text-[10px] text-zinc-500">{f.category}</p>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap">{formatBRL(f.amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-0.5 justify-end">
                          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-purple-600" title="Editar" onClick={() => setEditingFixed(f)}><Pencil className="w-4 h-4"/></Button>
                          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-600" onClick={async () => { if(confirm("Excluir? Os lançamentos já realizados serão mantidos.")) await deleteFixedExpense(f.id) }}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* CSS para esconder scrollbar mantendo o scroll */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// SUB-COMPONENTE: TABELA COM PAGINAÇÃO EMBUTIDA E ALTA PERFORMANCE
function TransactionTable({ transactions, today, setPayingTx, handleDelete, formatBRL, formatDate, handleWhatsApp, emptyMsg, currentPage, setCurrentPage, itemsPerPage, isExtrato = false }: any) {
  
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const currentData = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto hide-scrollbar">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
            <TableRow className="dark:border-zinc-800">
              <TableHead className="w-[100px] dark:text-zinc-400">{isExtrato ? "Pagamento" : "Venc."}</TableHead>
              <TableHead className="dark:text-zinc-400 min-w-[180px]">Descrição / Origem</TableHead>
              <TableHead className="text-center dark:text-zinc-400">{isExtrato ? "Meio" : "Status"}</TableHead>
              <TableHead className="text-right dark:text-zinc-400">Valor</TableHead>
              <TableHead className="text-right w-[90px] dark:text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-zinc-500">{emptyMsg}</TableCell></TableRow>
            )}
            {currentData.map((t: any) => {
              const isLate = t.status === "PENDING" && new Date(t.dueDate).getTime() < today.getTime();
              
              return (
                <TableRow key={t.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:border-zinc-800">
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Calendar className={`w-3.5 h-3.5 shrink-0 ${isLate && !isExtrato ? 'text-red-500' : 'text-zinc-400'}`} />
                      <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${isLate && !isExtrato ? 'text-red-600 font-bold' : 'text-zinc-600 dark:text-zinc-300'}`}>
                        {formatDate(isExtrato ? t.paymentDate : t.dueDate).substring(0, 5)} {/* Mostra só DD/MM no mobile se apertado */}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {t.type === "INCOME" ? <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0"/> : <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0"/>}
                      <div>
                        {t.order ? (
                          <div className="flex items-center gap-2 mb-0.5 whitespace-nowrap">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">{t.order.customer?.name}</span>
                            <Badge variant="outline" className="text-[9px] bg-zinc-100 dark:bg-zinc-800 border-0 px-1 py-0 h-4">OS #{t.order.number}</Badge>
                          </div>
                        ) : (
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm mb-0.5 whitespace-nowrap">{t.title}</p>
                        )}
                        <p className="text-[10px] sm:text-xs text-zinc-500 flex items-center gap-1 whitespace-nowrap">{t.order && <User className="w-3 h-3"/>} {t.category}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    {isExtrato ? (
                      <Badge variant="outline" className="uppercase text-[9px] sm:text-[10px] tracking-wider text-zinc-500 border-zinc-200 dark:border-zinc-700 whitespace-nowrap">{t.paymentMethod || "Caixa"}</Badge>
                    ) : (
                      t.status === "PAID" 
                        ? <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 border-0 text-[10px] sm:text-xs whitespace-nowrap">Liquidado</Badge>
                        : isLate 
                          ? <Badge variant="destructive" className="font-bold border-0 text-[10px] sm:text-xs whitespace-nowrap">Atrasado</Badge>
                          : <Badge className="bg-yellow-100 text-yellow-800 border-0 text-[10px] sm:text-xs whitespace-nowrap">A Vencer</Badge>
                    )}
                  </TableCell>

                  <TableCell className={`text-right font-bold text-sm sm:text-base whitespace-nowrap ${t.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                    {t.type === "INCOME" ? "+" : "-"} {formatBRL(t.amount)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5 sm:gap-1">
                      {t.status === "PENDING" && t.type === "INCOME" && t.order && handleWhatsApp && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleWhatsApp(t)} title="Cobrar no WhatsApp"><MessageCircle className="w-4 h-4"/></Button>
                      )}
                      {t.status === "PENDING" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => setPayingTx(t.id)} title="Dar Baixa"><CheckCircle className="w-4 h-4"/></Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={async () => { if(confirm("Apagar registro?")) await handleDelete(t.id) }}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* CONTROLES DE PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 mt-auto">
          <p className="text-[10px] sm:text-xs text-zinc-500 font-medium text-center sm:text-left">Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, transactions.length)} de {transactions.length} registros</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex-1 sm:flex-none dark:bg-zinc-900 dark:border-zinc-800"><ChevronLeft className="w-4 h-4 mr-1"/> Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex-1 sm:flex-none dark:bg-zinc-900 dark:border-zinc-800">Próxima <ChevronRight className="w-4 h-4 ml-1"/></Button>
          </div>
        </div>
      )}
    </div>
  );
}