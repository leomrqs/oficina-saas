"use client";
// app/dashboard/faturamento/ClientFaturamentoManager.tsx
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Plus, Trash2, CheckCircle, ArrowUpCircle, ArrowDownCircle,
  DollarSign, ChevronLeft, ChevronRight, CreditCard, Banknote, Smartphone,
  FileText, Zap, FileOutput, Building, AlertCircle, Loader2, ExternalLink, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  generateMonthlyPayments, markPaymentStatus,
  createSaaSFixedExpense, deleteSaaSFixedExpense, updateSaaSFixedExpense,
  markExpensePaymentStatus, deleteExpensePayment, generateSaaSExpensePaymentsForMonth,
} from "@/actions/saas";
import { createTransaction, deleteTransaction, markAsPaid } from "@/actions/finance";
import { toast } from "sonner";

type Payment = {
  id: string; tenantId: string; month: number; year: number;
  amount: number; status: string; paidAt: Date | null; dueDate: Date;
  tenant: { name: string; saasPlan: string; isActive: boolean };
};
type Tenant = {
  id: string; name: string; cnpj: string | null; isActive: boolean;
  saasPlan: string; saasPrice: number; saasDueDate: number;
};
type FixedExpense = {
  id: string; title: string; category: string; amount: number; dueDay: number;
};
type ExpensePayment = {
  id: string; fixedExpenseId: string | null; month: number; year: number;
  amount: number; status: string; paidAt: Date | null;
  title: string; category: string;
  fixedExpense: { title: string; category: string; dueDay: number } | null;
};
type ManualTransaction = {
  id: string; title: string; type: string; category: string;
  amount: number; status: string; dueDate: Date; paymentDate: Date | null;
  paymentMethod: string | null; notes: string | null;
};

const saasCategories = [
  "Hospedagem / Servidores",
  "Banco de Dados",
  "Domínio / DNS",
  "E-mail Transacional",
  "CDN / Storage",
  "Ferramentas Dev",
  "Marketing Digital",
  "Outros Custos SaaS",
];

export function ClientFaturamentoManager({
  payments: initialPayments,
  tenants,
  fixedExpenses: initialFixed,
  expensePayments: initialExpensePayments,
  manualTransactions: initialManualTransactions = [],
}: {
  payments: Payment[];
  tenants: Tenant[];
  fixedExpenses: FixedExpense[];
  expensePayments: ExpensePayment[];
  manualTransactions?: ManualTransaction[];
}) {
  const [payments, setPayments] = useState(initialPayments);
  const [fixedExpenses, setFixedExpenses] = useState(initialFixed);
  const [expensePayments, setExpensePayments] = useState(initialExpensePayments);
  const [manualTransactions, setManualTransactions] = useState(initialManualTransactions);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Modals
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [editingFixed, setEditingFixed] = useState<FixedExpense | null>(null);
  const [isCreatingFixed, setIsCreatingFixed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [markingOverdue, setMarkingOverdue] = useState<string | null>(null);
  const [markingExpenseId, setMarkingExpenseId] = useState<string | null>(null);
  const [fixedForm, setFixedForm] = useState({ title: "", category: "", amount: "", dueDay: "" });
  const [openManualModal, setOpenManualModal] = useState<"INCOME" | "EXPENSE" | null>(null);
  const [isGeneratingExpenses, setIsGeneratingExpenses] = useState(false);
  const [payingManualId, setPayingManualId] = useState<string | null>(null);
  const [payingManualMethod, setPayingManualMethod] = useState("PIX");

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const formatBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const changeMonth = (offset: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentDate(d);
    setCurrentPage(1);
  };

  const selectedMonth = currentDate.getMonth() + 1;
  const selectedYear = currentDate.getFullYear();

  // Filtered payments by month
  const periodPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchMonth = p.month === selectedMonth && p.year === selectedYear;
      const matchSearch = p.tenant.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchMonth && matchSearch;
    });
  }, [payments, selectedMonth, selectedYear, searchTerm]);

  // Filtered expense payments by month
  const periodExpenses = useMemo(() => {
    return expensePayments.filter((ep) => ep.month === selectedMonth && ep.year === selectedYear);
  }, [expensePayments, selectedMonth, selectedYear]);

  const pendingExpenses = periodExpenses.filter((ep) => ep.status !== "PAID");
  const paidExpenses = periodExpenses.filter((ep) => ep.status === "PAID");

  // Manual transactions for selected month
  const periodManualTransactions = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    return manualTransactions.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= start && d <= end;
    }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [manualTransactions, selectedMonth, selectedYear]);

  // DRE calculation
  const dre = useMemo(() => {
    const received = periodPayments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
    const pending = periodPayments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
    const overdue = periodPayments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);
    const fixedCosts = fixedExpenses.reduce((s, f) => s + f.amount, 0);
    const expPaid = periodExpenses.filter((ep) => ep.status === "PAID").reduce((s, ep) => s + ep.amount, 0);
    const expPending = periodExpenses.filter((ep) => ep.status !== "PAID").reduce((s, ep) => s + ep.amount, 0);
    const mrr = tenants.filter((t) => t.isActive).reduce((s, t) => s + t.saasPrice, 0);
    const profit = received - expPaid;
    const margin = received > 0 ? ((profit / received) * 100).toFixed(1) : "0.0";
    return { mrr, received, pending, overdue, fixedCosts, expPaid, expPending, profit, margin, totalPayments: periodPayments.length };
  }, [periodPayments, fixedExpenses, tenants, periodExpenses]);

  // Pagination
  const pendingPayments = periodPayments.filter((p) => p.status !== "PAID");
  const paidPayments = periodPayments.filter((p) => p.status === "PAID");
  const totalPages = (data: any[]) => Math.ceil(data.length / itemsPerPage);
  const paginate = (data: any[]) => data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  async function handleGeneratePayments() {
    setIsGenerating(true);
    try {
      const result = await generateMonthlyPayments();
      if (result.created > 0) {
        toast.success(`${result.created} cobranças geradas para ${result.total} oficinas!`);
      } else {
        toast.info("As cobranças deste mês já foram geradas.");
      }
    } catch {
      toast.error("Erro ao gerar cobranças.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleConfirmPayment() {
    if (!payingId) return;
    setIsConfirming(true);
    try {
      await markPaymentStatus(payingId, "PAID");
      setPayments((prev) =>
        prev.map((p) => (p.id === payingId ? { ...p, status: "PAID", paidAt: new Date() } : p))
      );
      toast.success("Pagamento confirmado!");
      setPayingId(null);
    } catch {
      toast.error("Erro ao confirmar pagamento.");
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleMarkOverdue(id: string) {
    setMarkingOverdue(id);
    try {
      await markPaymentStatus(id, "OVERDUE");
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "OVERDUE" } : p))
      );
      toast.success("Marcado como atrasado.");
    } catch {
      toast.error("Erro ao atualizar status.");
    } finally {
      setMarkingOverdue(null);
    }
  }

  async function handleMarkPending(id: string) {
    try {
      await markPaymentStatus(id, "PENDING");
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "PENDING", paidAt: null } : p))
      );
      toast.success("Revertido para pendente.");
    } catch {
      toast.error("Erro ao reverter.");
    }
  }

  async function handleCreateFixed(e: React.FormEvent) {
    e.preventDefault();
    setIsCreatingFixed(true);
    try {
      const result = await createSaaSFixedExpense({
        title: fixedForm.title,
        category: fixedForm.category,
        amount: parseFloat(fixedForm.amount),
        dueDay: parseInt(fixedForm.dueDay),
      });
      setFixedExpenses((prev) => [...prev, result as FixedExpense]);
      setShowFixedModal(false);
      setFixedForm({ title: "", category: "", amount: "", dueDay: "" });
      toast.success("Custo fixo cadastrado!");
    } catch {
      toast.error("Erro ao cadastrar custo fixo.");
    } finally {
      setIsCreatingFixed(false);
    }
  }

  async function handleDeleteFixed(id: string) {
    if (!confirm("Excluir este custo fixo? Os lançamentos já realizados serão mantidos no histórico.")) return;
    try {
      await deleteSaaSFixedExpense(id);
      setFixedExpenses((prev) => prev.filter((f) => f.id !== id));
      toast.success("Custo fixo removido. Histórico preservado.");
    } catch {
      toast.error("Erro ao remover.");
    }
  }

  async function handleEditFixed(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFixed) return;
    setIsCreatingFixed(true);
    try {
      await updateSaaSFixedExpense(editingFixed.id, {
        title: fixedForm.title,
        category: fixedForm.category,
        amount: parseFloat(fixedForm.amount),
        dueDay: parseInt(fixedForm.dueDay),
      });
      setFixedExpenses((prev) =>
        prev.map((f) =>
          f.id === editingFixed.id
            ? { ...f, title: fixedForm.title, category: fixedForm.category, amount: parseFloat(fixedForm.amount), dueDay: parseInt(fixedForm.dueDay) }
            : f
        )
      );
      setEditingFixed(null);
      toast.success("Custo fixo atualizado! Lançamentos futuros pendentes também foram ajustados.");
    } catch {
      toast.error("Erro ao atualizar custo fixo.");
    } finally {
      setIsCreatingFixed(false);
    }
  }

  async function handleCreateManual(formData: FormData) {
    try {
      await createTransaction(formData);
      toast.success("Lançamento registrado!");
      setOpenManualModal(null);
    } catch {
      toast.error("Erro ao registrar lançamento.");
    }
  }

  async function handleMarkExpenseStatus(id: string, status: string) {
    setMarkingExpenseId(id);
    try {
      await markExpensePaymentStatus(id, status);
      setExpensePayments((prev) =>
        prev.map((ep) => (ep.id === id ? { ...ep, status, paidAt: status === "PAID" ? new Date() : null } : ep))
      );
      toast.success(status === "PAID" ? "Despesa paga!" : "Revertido para pendente.");
    } catch {
      toast.error("Erro ao atualizar status.");
    } finally {
      setMarkingExpenseId(null);
    }
  }

  async function handleDeleteExpensePayment(id: string) {
    if (!confirm("Apagar este lançamento de despesa?")) return;
    setMarkingExpenseId(id);
    try {
      await deleteExpensePayment(id);
      setExpensePayments((prev) => prev.filter((ep) => ep.id !== id));
      toast.success("Lançamento apagado.");
    } catch {
      toast.error("Erro ao apagar.");
    } finally {
      setMarkingExpenseId(null);
    }
  }

  async function handleGenerateExpenses() {
    setIsGeneratingExpenses(true);
    try {
      const count = await generateSaaSExpensePaymentsForMonth(selectedMonth, selectedYear);
      if (count > 0) toast.success(`${count} despesas lançadas para ${monthNames[currentDate.getMonth()]}!`);
      else toast.info(`As despesas de ${monthNames[currentDate.getMonth()]} já foram lançadas.`);
    } catch {
      toast.error("Erro ao lançar despesas.");
    } finally {
      setIsGeneratingExpenses(false);
    }
  }

  async function handleMarkManualPaid() {
    if (!payingManualId) return;
    try {
      await markAsPaid(payingManualId, payingManualMethod);
      setManualTransactions((prev) =>
        prev.map((t) => t.id === payingManualId ? { ...t, status: "PAID", paymentMethod: payingManualMethod, paymentDate: new Date() } : t)
      );
      toast.success("Baixa realizada!");
      setPayingManualId(null);
    } catch {
      toast.error("Erro ao dar baixa.");
    }
  }

  async function handleDeleteManual(id: string) {
    if (!confirm("Apagar este lançamento?")) return;
    try {
      await deleteTransaction(id);
      setManualTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Lançamento apagado.");
    } catch {
      toast.error("Erro ao apagar.");
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "PAID": return <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 text-[10px]">Recebido</Badge>;
      case "OVERDUE": return <Badge variant="destructive" className="text-[10px]">Atrasado</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px]">Pendente</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* MONTH SELECTOR + ACTIONS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4 w-full xl:w-auto justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border dark:border-zinc-800">
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center px-2">
            <h3 className="font-bold text-sm sm:text-lg text-zinc-900 dark:text-zinc-100 uppercase tracking-wider whitespace-nowrap">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-medium">
              Ciclo mensal de cobranças
            </p>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => changeMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full xl:w-auto">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Buscar oficina..."
              className="pl-9 w-full bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setOpenManualModal("EXPENSE")}
            className="w-full sm:w-auto text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/50"
          >
            <ArrowDownCircle className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Despesa</span>
          </Button>
          <Button
            onClick={() => setOpenManualModal("INCOME")}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ArrowUpCircle className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Receita</span>
          </Button>
        </div>
      </div>

      {/* ALERT IF NO PAYMENTS FOR THIS MONTH */}
      {periodPayments.length === 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-500 shrink-0" />
            <div>
              <p className="font-bold text-orange-900 dark:text-orange-400">Nenhuma cobrança encontrada</p>
              <p className="text-sm text-orange-800 dark:text-orange-500/80">
                Use a aba "A Receber" para gerar as cobranças de {monthNames[currentDate.getMonth()]}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MARK AS PAID DIALOG */}
      <Dialog open={!!payingId} onOpenChange={(open) => !open && setPayingId(null)}>
        <DialogContent className="w-[90vw] max-w-sm dark:bg-zinc-950 dark:border-zinc-800 rounded-xl">
          <DialogHeader>
            <DialogTitle className="dark:text-white text-xl">Confirmar Recebimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Qual foi o meio de pagamento utilizado?</p>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                <SelectItem value="PIX"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-500" /> PIX</div></SelectItem>
                <SelectItem value="CREDITO"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-500" /> Cartão de Crédito</div></SelectItem>
                <SelectItem value="DEBITO"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-orange-500" /> Cartão de Débito</div></SelectItem>
                <SelectItem value="DINHEIRO"><div className="flex items-center gap-2"><Banknote className="w-4 h-4 text-green-600" /> Dinheiro / Espécie</div></SelectItem>
                <SelectItem value="BOLETO"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-zinc-500" /> Boleto Bancário</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setPayingId(null)}>Cancelar</Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isConfirming}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isConfirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BAIXA LANÇAMENTO MANUAL DIALOG */}
      <Dialog open={!!payingManualId} onOpenChange={(open) => !open && setPayingManualId(null)}>
        <DialogContent className="w-[90vw] max-w-sm dark:bg-zinc-950 dark:border-zinc-800 rounded-xl">
          <DialogHeader>
            <DialogTitle className="dark:text-white text-xl">Confirmar Baixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Qual foi o meio de pagamento?</p>
            <Select value={payingManualMethod} onValueChange={setPayingManualMethod}>
              <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                <SelectItem value="PIX"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-500" /> PIX</div></SelectItem>
                <SelectItem value="CREDITO"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-500" /> Cartão de Crédito</div></SelectItem>
                <SelectItem value="DEBITO"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-orange-500" /> Cartão de Débito</div></SelectItem>
                <SelectItem value="DINHEIRO"><div className="flex items-center gap-2"><Banknote className="w-4 h-4 text-green-600" /> Dinheiro / Espécie</div></SelectItem>
                <SelectItem value="BOLETO"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-zinc-500" /> Boleto Bancário</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setPayingManualId(null)}>Cancelar</Button>
            <Button onClick={handleMarkManualPaid} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW FIXED EXPENSE DIALOG */}
      <Dialog open={showFixedModal} onOpenChange={setShowFixedModal}>
        <DialogContent className="w-[95vw] max-w-xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="p-5 border-b dark:border-zinc-800 text-white bg-purple-600 dark:bg-purple-700">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Zap /> Novo Custo Fixo SaaS
            </DialogTitle>
          </div>
          <form onSubmit={handleCreateFixed} className="p-5 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição</label>
                <Input
                  required
                  value={fixedForm.title}
                  onChange={(e) => setFixedForm({ ...fixedForm, title: e.target.value })}
                  placeholder="Ex: Vercel Pro, AWS RDS, Domínio..."
                  className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={fixedForm.amount}
                  onChange={(e) => setFixedForm({ ...fixedForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="h-12 font-bold text-lg sm:text-xl dark:bg-zinc-900 dark:border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</label>
                <Select
                  value={fixedForm.category}
                  onValueChange={(v) => setFixedForm({ ...fixedForm, category: v })}
                >
                  <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                    {saasCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Vence todo dia:
                </label>
                <Select
                  value={fixedForm.dueDay}
                  onValueChange={(v) => setFixedForm({ ...fixedForm, dueDay: v })}
                >
                  <SelectTrigger className="h-12 bg-purple-50 dark:bg-purple-950/30 border-purple-200 text-purple-900 font-bold">
                    <SelectValue placeholder="Escolha o dia" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 dark:bg-zinc-900 dark:border-zinc-800">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>Todo dia {d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setShowFixedModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingFixed} className="w-full sm:w-auto text-white bg-purple-600 hover:bg-purple-700">
                {isCreatingFixed ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT FIXED EXPENSE DIALOG */}
      <Dialog open={!!editingFixed} onOpenChange={(open) => !open && setEditingFixed(null)}>
        <DialogContent className="w-[95vw] max-w-xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="p-5 border-b dark:border-zinc-800 text-white bg-purple-600 dark:bg-purple-700">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Pencil /> Editar Custo Fixo
            </DialogTitle>
          </div>
          <form onSubmit={handleEditFixed} className="p-5 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição</label>
                <Input
                  required
                  value={fixedForm.title}
                  onChange={(e) => setFixedForm({ ...fixedForm, title: e.target.value })}
                  placeholder="Ex: Vercel Pro, AWS RDS..."
                  className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={fixedForm.amount}
                  onChange={(e) => setFixedForm({ ...fixedForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="h-12 font-bold text-lg sm:text-xl dark:bg-zinc-900 dark:border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</label>
                <Select
                  value={fixedForm.category}
                  onValueChange={(v) => setFixedForm({ ...fixedForm, category: v })}
                >
                  <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                    {saasCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Vence todo dia:
                </label>
                <Select
                  value={fixedForm.dueDay}
                  onValueChange={(v) => setFixedForm({ ...fixedForm, dueDay: v })}
                >
                  <SelectTrigger className="h-12 bg-purple-50 dark:bg-purple-950/30 border-purple-200 text-purple-900 font-bold">
                    <SelectValue placeholder="Escolha o dia" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 dark:bg-zinc-900 dark:border-zinc-800">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>Todo dia {d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              Lançamentos já pagos não serão alterados. Apenas os pendentes/futuros usarão o novo valor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setEditingFixed(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingFixed} className="w-full sm:w-auto text-white bg-purple-600 hover:bg-purple-700">
                {isCreatingFixed ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MANUAL TRANSACTION DIALOG */}
      <Dialog open={!!openManualModal} onOpenChange={(open) => !open && setOpenManualModal(null)}>
        <DialogContent className="w-[95vw] max-w-xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className={`p-5 border-b dark:border-zinc-800 text-white ${openManualModal === "INCOME" ? "bg-emerald-600 dark:bg-emerald-700" : "bg-red-600 dark:bg-red-700"}`}>
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              {openManualModal === "INCOME" ? <><ArrowUpCircle /> Nova Receita Avulsa</> : <><ArrowDownCircle /> Nova Despesa Avulsa</>}
            </DialogTitle>
          </div>
          <form action={handleCreateManual} className="p-5 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
            <input type="hidden" name="type" value={openManualModal || ""} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição</label>
                <Input name="title" required placeholder="Ex: Consultor, Venda de licença extra..." className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="h-12 font-bold text-lg dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria (DRE)</label>
                <Select name="category" required>
                  <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                    {(openManualModal === "INCOME"
                      ? ["Receita de Clientes", "Consultoria", "Outras Receitas"]
                      : [...saasCategories, "Outros Custos"]
                    ).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vencimento</label>
                <Input name="dueDate" type="date" required className="h-12 dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark] w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                <Select name="status" defaultValue="PENDING">
                  <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                    <SelectItem value="PAID">{openManualModal === "INCOME" ? "Já Recebido" : "Já Pago"}</SelectItem>
                    <SelectItem value="PENDING">{openManualModal === "INCOME" ? "A Receber" : "A Pagar"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpenManualModal(null)}>Cancelar</Button>
              <Button type="submit" className={`w-full sm:w-auto text-white ${openManualModal === "INCOME" ? "bg-emerald-600" : "bg-red-600"}`}>Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* TABS */}
      <Tabs defaultValue="dashboard" className="w-full" onValueChange={() => setCurrentPage(1)}>
        <div className="w-full overflow-x-auto hide-scrollbar mb-6 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-1">
          <TabsList className="flex w-max min-w-full justify-start md:justify-center bg-transparent">
            <TabsTrigger value="dashboard" className="dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">
              DRE / Resumo
            </TabsTrigger>
            <TabsTrigger value="receivable" className="data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">
              A Receber
            </TabsTrigger>
            <TabsTrigger value="paid" className="dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">
              Recebidos
            </TabsTrigger>
            <TabsTrigger value="payable" className="data-[state=active]:text-red-600 dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">
              A Pagar
            </TabsTrigger>
            <TabsTrigger value="extrato" className="dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">
              Extrato (Caixa)
            </TabsTrigger>
            <TabsTrigger value="fixed" className="data-[state=active]:text-purple-600 dark:data-[state=active]:bg-zinc-700 flex-1 whitespace-nowrap">
              Custos Fixos
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB: DRE */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">MRR Previsto vs Recebido</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {formatBRL(dre.received)} / {formatBRL(dre.mrr)}
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${dre.mrr > 0 ? Math.min((dre.received / dre.mrr) * 100, 100) : 0}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-500 uppercase tracking-wider mb-2">
                Recebido (Entrou)
              </p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                {formatBRL(dre.received)}
              </p>
            </div>
            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-red-800 dark:text-red-500 uppercase tracking-wider mb-2">
                Custos Fixos SaaS
              </p>
              <p className="text-2xl sm:text-3xl font-black text-red-700 dark:text-red-400">
                {formatBRL(dre.fixedCosts)}
              </p>
            </div>
            <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-orange-800 dark:text-orange-500 uppercase tracking-wider mb-2">
                Pendente + Atrasado
              </p>
              <p className="text-2xl sm:text-3xl font-black text-orange-700 dark:text-orange-400">
                {formatBRL(dre.pending + dre.overdue)}
              </p>
            </div>
            <div className={`p-5 rounded-xl border ${dre.profit >= 0 ? "bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-800" : "bg-gradient-to-br from-red-900 to-red-800 border-red-800"}`}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">Lucro SaaS</p>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[9px] sm:text-[10px]">
                  {dre.margin}% Margem
                </Badge>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{formatBRL(dre.profit)}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    A Receber
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatBRL(dre.pending)}</p>
                </div>
                {dre.overdue > 0 && (
                  <div className="text-right">
                    <p className="text-[9px] sm:text-[10px] font-bold text-red-500 uppercase">Atrasado</p>
                    <p className="text-lg font-black text-red-600 dark:text-red-500">{formatBRL(dre.overdue)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                A Pagar (Despesas)
              </p>
              <p className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">{formatBRL(dre.expPending)}</p>
              {dre.expPaid > 0 && (
                <p className="text-[10px] text-zinc-500 mt-1">Pago: {formatBRL(dre.expPaid)}</p>
              )}
            </div>
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Cobranças Geradas
              </p>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">{dre.totalPayments}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl">
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Despesas do Mês
              </p>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">{periodExpenses.length}</p>
            </div>
          </div>
        </TabsContent>

        {/* TAB: A RECEBER */}
        <TabsContent value="receivable" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto hide-scrollbar">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
                <TableRow className="dark:border-zinc-800">
                  <TableHead className="dark:text-zinc-400">Oficina</TableHead>
                  <TableHead className="text-center dark:text-zinc-400 hidden sm:table-cell">Plano</TableHead>
                  <TableHead className="text-center dark:text-zinc-400">Status</TableHead>
                  <TableHead className="text-right dark:text-zinc-400">Valor</TableHead>
                  <TableHead className="text-right dark:text-zinc-400 w-[140px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-zinc-400">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Tudo em dia! Nenhuma cobrança pendente.</p>
                    </TableCell>
                  </TableRow>
                )}
                {paginate(pendingPayments).map((p) => (
                  <TableRow key={p.id} className="dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <TableCell>
                      <Link href={`/dashboard/oficinas/${p.tenantId}`} className="hover:text-blue-600">
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{p.tenant.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          Venc: {new Date(p.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant="outline" className="text-[10px]">{p.tenant.saasPlan}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatBRL(p.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          onClick={() => setPayingId(p.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Baixa
                        </Button>
                        {p.status !== "OVERDUE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => handleMarkOverdue(p.id)}
                            disabled={markingOverdue === p.id}
                          >
                            {markingOverdue === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <><AlertCircle className="w-3.5 h-3.5 mr-1" /> Atrasar</>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {totalPages(pendingPayments) > 1 && (
            <div className="flex items-center justify-between p-4 border-t dark:border-zinc-800">
              <span className="text-xs text-zinc-500">
                {pendingPayments.length} registro(s)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-7">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs text-zinc-500 self-center">{currentPage}/{totalPages(pendingPayments)}</span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages(pendingPayments)} onClick={() => setCurrentPage((p) => p + 1)} className="h-7">
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB: RECEBIDOS */}
        <TabsContent value="paid" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto hide-scrollbar">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
                <TableRow className="dark:border-zinc-800">
                  <TableHead className="dark:text-zinc-400">Oficina</TableHead>
                  <TableHead className="text-center dark:text-zinc-400 hidden sm:table-cell">Plano</TableHead>
                  <TableHead className="text-center dark:text-zinc-400">Pago em</TableHead>
                  <TableHead className="text-right dark:text-zinc-400">Valor</TableHead>
                  <TableHead className="text-right dark:text-zinc-400 w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-zinc-400">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum recebimento neste mês.</p>
                    </TableCell>
                  </TableRow>
                )}
                {paginate(paidPayments).map((p) => (
                  <TableRow key={p.id} className="dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <TableCell>
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{p.tenant.name}</p>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant="outline" className="text-[10px]">{p.tenant.saasPlan}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs text-zinc-500">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatBRL(p.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] text-zinc-500 hover:text-red-600"
                        onClick={() => handleMarkPending(p.id)}
                      >
                        Reverter
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {paidPayments.length > 0 && (
            <div className="p-4 border-t dark:border-zinc-800 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-950/10">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                Total Recebido
              </span>
              <span className="font-black text-emerald-700 dark:text-emerald-400">
                {formatBRL(dre.received)}
              </span>
            </div>
          )}
        </TabsContent>

        {/* TAB: A PAGAR (Despesas Mensais) */}
        <TabsContent value="payable" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-zinc-800 bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-zinc-900">
            <h3 className="text-sm font-bold text-red-900 dark:text-red-300 flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-red-600" />
              Contas a Pagar — {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <p className="text-[10px] text-red-700/60 dark:text-red-400/60 mt-0.5">
              Despesas mensais geradas automaticamente dos custos fixos cadastrados.
            </p>
          </div>

          {/* Pendentes */}
          {pendingExpenses.length > 0 && (
            <div className="overflow-x-auto hide-scrollbar">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
                  <TableRow className="dark:border-zinc-800">
                    <TableHead className="dark:text-zinc-400">Despesa</TableHead>
                    <TableHead className="text-center dark:text-zinc-400 hidden sm:table-cell">Categoria</TableHead>
                    <TableHead className="text-center dark:text-zinc-400">Status</TableHead>
                    <TableHead className="text-right dark:text-zinc-400">Valor</TableHead>
                    <TableHead className="text-right dark:text-zinc-400 w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingExpenses.map((ep) => (
                    <TableRow key={ep.id} className="dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <TableCell>
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{ep.title || ep.fixedExpense?.title}</p>
                        {ep.fixedExpense && <p className="text-[10px] text-zinc-500">Venc: Dia {ep.fixedExpense.dueDay}</p>}
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px]">{ep.category || ep.fixedExpense?.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {ep.status === "OVERDUE"
                          ? <Badge variant="destructive" className="text-[10px]">Atrasado</Badge>
                          : <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px]">Pendente</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                        {formatBRL(ep.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            onClick={() => handleMarkExpenseStatus(ep.id, "PAID")}
                            disabled={markingExpenseId === ep.id}
                          >
                            {markingExpenseId === ep.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Pagar</>
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => handleDeleteExpensePayment(ep.id)}
                            disabled={markingExpenseId === ep.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pendingExpenses.length === 0 && paidExpenses.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              <ArrowDownCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma despesa neste mês.</p>
              <p className="text-xs mt-1">Cadastre custos fixos na aba "Custos Fixos" para gerar automaticamente.</p>
            </div>
          )}

          {pendingExpenses.length === 0 && paidExpenses.length > 0 && (
            <div className="text-center py-8 text-zinc-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">Todas as despesas do mês foram pagas!</p>
            </div>
          )}

          {/* Pagas */}
          {paidExpenses.length > 0 && (
            <>
              <div className="px-4 py-2 bg-emerald-50/50 dark:bg-emerald-950/10 border-t border-b dark:border-zinc-800">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Despesas Pagas ({paidExpenses.length})
                </span>
              </div>
              <div className="overflow-x-auto hide-scrollbar">
                <Table>
                  <TableBody>
                    {paidExpenses.map((ep) => (
                      <TableRow key={ep.id} className="dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <TableCell>
                          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{ep.title || ep.fixedExpense?.title}</p>
                          <p className="text-[10px] text-zinc-500">{ep.category || ep.fixedExpense?.category}</p>
                        </TableCell>
                        <TableCell className="text-center text-xs text-zinc-500 hidden sm:table-cell">
                          {ep.paidAt ? new Date(ep.paidAt).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatBRL(ep.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[10px] text-zinc-500 hover:text-red-600"
                              onClick={() => handleMarkExpenseStatus(ep.id, "PENDING")}
                              disabled={markingExpenseId === ep.id}
                            >
                              Reverter
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => handleDeleteExpensePayment(ep.id)}
                              disabled={markingExpenseId === ep.id}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Total footer */}
          {periodExpenses.length > 0 && (
            <div className="p-4 border-t dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-2 items-start sm:items-center">
              <div className="flex gap-4">
                <span className="text-xs text-zinc-500">
                  Pendente: <span className="font-bold text-red-600 dark:text-red-400">{formatBRL(dre.expPending)}</span>
                </span>
                <span className="text-xs text-zinc-500">
                  Pago: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(dre.expPaid)}</span>
                </span>
              </div>
              <span className="text-xs font-bold text-zinc-500 uppercase">
                Total: <span className="text-zinc-900 dark:text-zinc-100">{formatBRL(dre.expPending + dre.expPaid)}</span>
              </span>
            </div>
          )}
        </TabsContent>

        {/* TAB: EXTRATO (CAIXA) */}
        <TabsContent value="extrato" className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-950/50 dark:to-zinc-900">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-zinc-600" />
              Extrato (Caixa) — {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Lançamentos avulsos de receita e despesa do SaaS neste mês.
            </p>
          </div>

          {periodManualTransactions.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum lançamento avulso neste mês.</p>
              <p className="text-xs mt-1">Use os botões "Despesa" e "Receita" para registrar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto hide-scrollbar">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
                  <TableRow className="dark:border-zinc-800">
                    <TableHead className="dark:text-zinc-400">Descrição</TableHead>
                    <TableHead className="text-center dark:text-zinc-400 hidden sm:table-cell">Categoria</TableHead>
                    <TableHead className="text-center dark:text-zinc-400">Status</TableHead>
                    <TableHead className="text-center dark:text-zinc-400 hidden sm:table-cell">Meio</TableHead>
                    <TableHead className="text-right dark:text-zinc-400">Valor</TableHead>
                    <TableHead className="text-right dark:text-zinc-400 w-[90px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodManualTransactions.map((t) => {
                    const isLate = t.status === "PENDING" && new Date(t.dueDate).getTime() < Date.now();
                    return (
                      <TableRow key={t.id} className="dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {t.type === "INCOME"
                              ? <ArrowUpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              : <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />
                            }
                            <div>
                              <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{t.title}</p>
                              <p className="text-[10px] text-zinc-500">
                                Venc: {new Date(t.dueDate).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {t.status === "PAID"
                            ? <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 text-[10px]">Liquidado</Badge>
                            : isLate
                              ? <Badge variant="destructive" className="text-[10px]">Atrasado</Badge>
                              : <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px]">Pendente</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <span className="text-xs text-zinc-500 uppercase">{t.paymentMethod || "—"}</span>
                        </TableCell>
                        <TableCell className={`text-right font-bold whitespace-nowrap ${t.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {t.type === "INCOME" ? "+" : "-"} {formatBRL(t.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {t.status === "PENDING" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                title="Dar Baixa"
                                onClick={() => { setPayingManualId(t.id); setPayingManualMethod("PIX"); }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-400 hover:text-red-600"
                              onClick={() => handleDeleteManual(t.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Resumo do extrato */}
          {periodManualTransactions.length > 0 && (() => {
            const totalIn = periodManualTransactions.filter(t => t.type === "INCOME" && t.status === "PAID").reduce((s, t) => s + t.amount, 0);
            const totalOut = periodManualTransactions.filter(t => t.type === "EXPENSE" && t.status === "PAID").reduce((s, t) => s + t.amount, 0);
            return (
              <div className="p-4 border-t dark:border-zinc-800 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <span className="text-xs text-zinc-500">Entradas pagas: <span className="font-bold text-emerald-600">{formatBRL(totalIn)}</span></span>
                  <span className="text-xs text-zinc-500">Saídas pagas: <span className="font-bold text-red-600">{formatBRL(totalOut)}</span></span>
                </div>
                <span className="text-xs font-bold text-zinc-500">
                  Saldo: <span className={totalIn - totalOut >= 0 ? "text-emerald-600" : "text-red-600"}>{formatBRL(totalIn - totalOut)}</span>
                </span>
              </div>
            );
          })()}
        </TabsContent>

        {/* TAB: CUSTOS FIXOS */}
        <TabsContent value="fixed">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b dark:border-zinc-800 flex flex-col sm:flex-row justify-between gap-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-zinc-900">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" /> Custos Fixos de Operação
                </h3>
                <p className="text-[11px] sm:text-sm text-purple-700/70 dark:text-purple-400/70 mt-1">
                  Hosting, servidores, domínios e outros custos recorrentes do SaaS.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="border-purple-200 text-purple-700 bg-white dark:bg-zinc-900 w-full sm:w-auto"
                  onClick={() => setShowFixedModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Novo Custo Fixo
                </Button>
                <Button
                  onClick={handleGenerateExpenses}
                  disabled={isGeneratingExpenses}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-md w-full sm:w-auto"
                >
                  {isGeneratingExpenses ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileOutput className="w-4 h-4 mr-2" />}
                  Lançar Neste Ciclo
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-950/50 whitespace-nowrap">
                  <TableRow className="dark:border-zinc-800">
                    <TableHead className="w-[100px]">Vencimento</TableHead>
                    <TableHead>Descrição e Categoria</TableHead>
                    <TableHead className="text-right">Valor Fixo</TableHead>
                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-zinc-400">
                        <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum custo fixo cadastrado.</p>
                        <p className="text-xs mt-1">Adicione seus custos de hospedagem, servidores, etc.</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {fixedExpenses.map((f) => (
                    <TableRow key={f.id} className="dark:border-zinc-800">
                      <TableCell>
                        <Badge variant="outline" className="text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400 whitespace-nowrap">
                          Dia {f.dueDay}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{f.title}</p>
                        <p className="text-[10px] text-zinc-500">{f.category}</p>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                        {formatBRL(f.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-purple-600 h-8 w-8"
                            title="Editar"
                            onClick={() => {
                              setEditingFixed(f);
                              setFixedForm({ title: f.title, category: f.category, amount: String(f.amount), dueDay: String(f.dueDay) });
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-red-600 h-8 w-8"
                            onClick={() => handleDeleteFixed(f.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {fixedExpenses.length > 0 && (
              <div className="p-4 border-t dark:border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500 uppercase">
                  Total Mensal
                </span>
                <span className="font-black text-red-600 dark:text-red-400">
                  {formatBRL(fixedExpenses.reduce((s, f) => s + f.amount, 0))}
                </span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* SCROLLBAR HIDE CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </div>
  );
}
