"use client";
// app/dashboard/oficinas/ClientTenantManager.tsx
import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Building, Plus, MoreHorizontal, Loader2, Search, Download,
  DollarSign, Ban, CheckCircle2,
  ExternalLink, Shield,
} from "lucide-react";
import {
  createTenantWithUser, toggleTenantStatus, updateTenantBilling,
  bulkToggleStatus, exportTenantsCSV,
} from "@/actions/saas";

type Tenant = {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  isActive: boolean;
  saasPlan: string;
  saasPrice: number;
  saasDueDate: number;
  expiresAt: Date | null;
  createdAt: Date;
  lastActivity: Date | null;
  _count: { users: number; orders: number; customers: number; products: number };
};

function computeHealthFromTenant(t: Tenant): number {
  let score = 70; // base
  if (!t.isActive) return 0;
  if (t.lastActivity) {
    const days = Math.floor((Date.now() - new Date(t.lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 14) score -= 25;
    else if (days > 7) score -= 10;
    else score += 10;
  } else {
    score -= 30;
  }
  if (t._count.orders === 0) score -= 15;
  if (t._count.customers === 0) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function HealthDot({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{score}</span>
    </div>
  );
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function ClientTenantManager({ tenants: initialTenants }: { tenants: Tenant[] }) {
  const [tenants, setTenants] = useState(initialTenants);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    tenantName: "", cnpj: "", phone: "",
    managerName: "", managerEmail: "", managerPassword: "",
    saasPlan: "Mensal", saasPrice: "147", saasDueDate: "10",
  });

  // Edit billing modal
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ saasPlan: "", saasPrice: "", saasDueDate: "" });

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.cnpj && t.cnpj.includes(search));
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && t.isActive) ||
        (statusFilter === "blocked" && !t.isActive);
      const matchPlan = planFilter === "all" || t.saasPlan === planFilter;
      const health = computeHealthFromTenant(t);
      const matchHealth =
        healthFilter === "all" ||
        (healthFilter === "healthy" && health >= 70) ||
        (healthFilter === "warning" && health >= 40 && health < 70) ||
        (healthFilter === "critical" && health < 40);
      return matchSearch && matchStatus && matchPlan && matchHealth;
    });
  }, [tenants, search, statusFilter, planFilter, healthFilter]);

  const activeTenants = tenants.filter((t) => t.isActive);
  const mrr = activeTenants.reduce((s, t) => s + t.saasPrice, 0);
  const plans = [...new Set(tenants.map((t) => t.saasPlan))];

  // Select all / deselect
  const allSelected = filteredTenants.length > 0 && filteredTenants.every((t) => selectedIds.has(t.id));
  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTenants.map((t) => t.id)));
    }
  }
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Handlers
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsCreating(true);
    try {
      const result = await createTenantWithUser({
        tenantName: formData.tenantName,
        cnpj: formData.cnpj || undefined,
        phone: formData.phone || undefined,
        managerName: formData.managerName,
        managerEmail: formData.managerEmail,
        managerPassword: formData.managerPassword,
        saasPlan: formData.saasPlan,
        saasPrice: parseFloat(formData.saasPrice),
        saasDueDate: parseInt(formData.saasDueDate),
      });
      toast.success("Oficina criada com sucesso!");
      setShowCreate(false);
      setFormData({
        tenantName: "", cnpj: "", phone: "",
        managerName: "", managerEmail: "", managerPassword: "",
        saasPlan: "Mensal", saasPrice: "147", saasDueDate: "10",
      });
      // Optimistic: add to list
      setTenants((prev) => [
        {
          ...result,
          phone: result.phone ?? null,
          cnpj: result.cnpj ?? null,
          expiresAt: null,
          lastActivity: null,
          _count: { users: 1, orders: 0, customers: 0, products: 0 },
        } as Tenant,
        ...prev,
      ]);
    } catch (err: any) {
      toast.error("Erro ao criar oficina", { description: err.message });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await toggleTenantStatus(id, isActive);
      setTenants((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive } : t))
      );
      toast.success(isActive ? "Oficina ativada!" : "Oficina bloqueada!");
    } catch {
      toast.error("Erro ao alterar status.");
    }
  }

  async function handleEditBilling(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTenant) return;
    setIsEditing(true);
    try {
      await updateTenantBilling(editTenant.id, {
        saasPlan: editData.saasPlan,
        saasPrice: parseFloat(editData.saasPrice),
        saasDueDate: parseInt(editData.saasDueDate),
      });
      setTenants((prev) =>
        prev.map((t) =>
          t.id === editTenant.id
            ? {
                ...t,
                saasPlan: editData.saasPlan,
                saasPrice: parseFloat(editData.saasPrice),
                saasDueDate: parseInt(editData.saasDueDate),
              }
            : t
        )
      );
      toast.success("Cobrança atualizada!");
      setEditTenant(null);
    } catch {
      toast.error("Erro ao atualizar cobrança.");
    } finally {
      setIsEditing(false);
    }
  }

  async function handleBulkToggle(isActive: boolean) {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      await bulkToggleStatus(Array.from(selectedIds), isActive);
      setTenants((prev) =>
        prev.map((t) => (selectedIds.has(t.id) ? { ...t, isActive } : t))
      );
      toast.success(`${selectedIds.size} oficina(s) ${isActive ? "ativada(s)" : "bloqueada(s)"}.`);
      setSelectedIds(new Set());
    } catch {
      toast.error("Erro na operação em lote.");
    } finally {
      setIsBulkLoading(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const csv = await exportTenantsCSV();
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `oficinas_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída!");
    } catch {
      toast.error("Erro ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  }

  function getDaysAgo(date: Date | null): string {
    if (!date) return "Nunca";
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hoje";
    if (days === 1) return "Ontem";
    return `${days}d atrás`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Oficinas</h2>
          <p className="text-sm text-zinc-500 mt-1">Gerencie todas as oficinas cadastradas na plataforma.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2 flex-1 sm:flex-none"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2 flex-1 sm:flex-none">
            <Plus className="w-4 h-4" /> Nova Oficina
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTenants.length}</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${tenants.length - activeTenants.length > 0 ? "border-l-red-500" : "border-l-zinc-300"}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueadas</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length - activeTenants.length}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(mrr)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="blocked">Bloqueadas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={(v) => { if (v) setPlanFilter(v); }}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {plans.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={healthFilter} onValueChange={(v) => { if (v) setHealthFilter(v); }}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Saúde" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="healthy">Saudável</SelectItem>
            <SelectItem value="warning">Atenção</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.size} selecionada(s)
            </span>
          </div>
          <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkToggle(true)}
              disabled={isBulkLoading}
              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 h-7 text-xs flex-1 sm:flex-none"
            >
              {isBulkLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              Ativar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkToggle(false)}
              disabled={isBulkLoading}
              className="text-red-600 border-red-300 hover:bg-red-50 h-7 text-xs flex-1 sm:flex-none"
            >
              {isBulkLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
              Bloquear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 text-xs"
            >
              Limpar
            </Button>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                  <th className="px-3 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-zinc-300 accent-blue-600"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Oficina</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-500 uppercase hidden md:table-cell">Plano</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-zinc-500 uppercase hidden sm:table-cell">Mensalidade</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-500 uppercase hidden lg:table-cell">Saúde</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-500 uppercase hidden lg:table-cell">Atividade</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-500 uppercase">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-500 uppercase w-12">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800">
                {filteredTenants.map((t) => {
                  const health = computeHealthFromTenant(t);
                  return (
                    <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(t.id)}
                          onChange={() => toggleSelect(t.id)}
                          className="h-4 w-4 rounded border-zinc-300 accent-blue-600"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-md shrink-0">
                            <Building className="w-3.5 h-3.5 text-zinc-500" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/oficinas/${t.id}`}
                              className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                            >
                              {t.name}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </Link>
                            <p className="text-xs text-zinc-500 truncate">{t.cnpj || "Sem CNPJ"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{t.saasPlan}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold hidden sm:table-cell">
                        {formatBRL(t.saasPrice)}
                      </td>
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        <HealthDot score={health} />
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-zinc-500 hidden lg:table-cell">
                        {getDaysAgo(t.lastActivity)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              t.isActive
                                ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                                : "text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20"
                            }`}
                          >
                            {t.isActive ? "Ativa" : "Bloqueada"}
                          </Badge>
                          {t.expiresAt && (
                            <span className={`text-[9px] font-medium ${new Date(t.expiresAt) < new Date() ? "text-red-500" : new Date(t.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 ? "text-orange-500" : "text-zinc-400"}`}>
                              {new Date(t.expiresAt) < new Date() ? "Expirado" : `Exp: ${new Date(t.expiresAt).toLocaleDateString("pt-BR")}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon" className="h-7 w-7" />}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              render={<Link href={`/dashboard/oficinas/${t.id}`} className="flex items-center gap-2 cursor-pointer" />}
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditTenant(t);
                                setEditData({
                                  saasPlan: t.saasPlan,
                                  saasPrice: String(t.saasPrice),
                                  saasDueDate: String(t.saasDueDate),
                                });
                              }}
                            >
                              <DollarSign className="w-3.5 h-3.5 mr-2" /> Editar Cobrança
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggle(t.id, !t.isActive)}
                              className={t.isActive ? "text-red-600" : "text-emerald-600"}
                            >
                              {t.isActive ? (
                                <><Ban className="w-3.5 h-3.5 mr-2" /> Bloquear Acesso</>
                              ) : (
                                <><CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Ativar Acesso</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-zinc-400">
                      <Building className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhuma oficina encontrada.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="w-[95vw] max-w-xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="p-5 border-b dark:border-zinc-800 text-white bg-blue-600 dark:bg-blue-700">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Building /> Nova Oficina Parceira
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">
              Cadastre uma nova oficina e seu gestor principal.
            </DialogDescription>
          </div>
          <form onSubmit={handleCreate} className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Dados da Oficina</h4>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome da Oficina *</label>
                <Input required value={formData.tenantName} onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })} placeholder="Ex: Auto Center Silva" className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CNPJ</label>
                  <Input value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} placeholder="00.000.000/0000-00" className="h-12 dark:bg-zinc-900 dark:border-zinc-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Telefone</label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" className="h-12 dark:bg-zinc-900 dark:border-zinc-800" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Gestor Principal</h4>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome *</label>
                <Input required value={formData.managerName} onChange={(e) => setFormData({ ...formData, managerName: e.target.value })} placeholder="Nome completo do gestor" className="h-12 dark:bg-zinc-900 dark:border-zinc-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">E-mail *</label>
                  <Input type="email" required value={formData.managerEmail} onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })} placeholder="gestor@email.com" className="h-12 dark:bg-zinc-900 dark:border-zinc-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Senha *</label>
                  <Input type="text" required minLength={6} value={formData.managerPassword} onChange={(e) => setFormData({ ...formData, managerPassword: e.target.value })} placeholder="Mínimo 6 caracteres" className="h-12 dark:bg-zinc-900 dark:border-zinc-800" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Plano e Cobrança</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Plano</label>
                  <Select value={formData.saasPlan} onValueChange={(v) => { if (v) setFormData({ ...formData, saasPlan: v }); }}>
                    <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                  <Input type="number" step="0.01" value={formData.saasPrice} onChange={(e) => setFormData({ ...formData, saasPrice: e.target.value })} className="h-12 font-bold text-lg dark:bg-zinc-900 dark:border-zinc-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Dia Venc.</label>
                  <Input type="number" min="1" max="28" value={formData.saasDueDate} onChange={(e) => setFormData({ ...formData, saasDueDate: e.target.value })} className="h-12 dark:bg-zinc-900 dark:border-zinc-800" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</> : "Criar Oficina"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Billing Dialog */}
      <Dialog open={!!editTenant} onOpenChange={(open) => { if (!open) setEditTenant(null); }}>
        <DialogContent className="w-[95vw] max-w-md bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="p-5 border-b dark:border-zinc-800 text-white bg-violet-600 dark:bg-violet-700">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign /> Editar Cobrança
            </DialogTitle>
            <p className="text-violet-100 text-sm mt-1">{editTenant?.name ?? ""}</p>
          </div>
          <form onSubmit={handleEditBilling} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Plano</label>
              <Select value={editData.saasPlan} onValueChange={(v) => { if (v) setEditData({ ...editData, saasPlan: v }); }}>
                <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800"><SelectValue /></SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Semestral">Semestral</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
              <Input type="number" step="0.01" value={editData.saasPrice} onChange={(e) => setEditData({ ...editData, saasPrice: e.target.value })} className="h-12 font-bold text-lg dark:bg-zinc-900 dark:border-zinc-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Dia de Vencimento</label>
              <Input type="number" min="1" max="28" value={editData.saasDueDate} onChange={(e) => setEditData({ ...editData, saasDueDate: e.target.value })} className="h-12 dark:bg-zinc-900 dark:border-zinc-800" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setEditTenant(null)}>Cancelar</Button>
              <Button type="submit" disabled={isEditing} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white">
                {isEditing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
