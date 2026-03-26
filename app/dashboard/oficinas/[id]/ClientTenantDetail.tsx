"use client";
// app/dashboard/oficinas/[id]/ClientTenantDetail.tsx
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, Building, Shield, FileText, DollarSign, Users,
  Package, HardHat, Heart, CalendarClock, TrendingUp, TrendingDown,
  Loader2, Trash2, KeyRound, Plus, StickyNote, CreditCard,
  Phone, MapPin, Hash, Activity, ExternalLink, Timer,
} from "lucide-react";
import {
  addTenantNote, deleteTenantNote, resetUserPassword,
  toggleTenantStatus, createImpersonationToken, updateTenantExpiration,
} from "@/actions/saas";

type TenantDetail = {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  saasPlan: string;
  saasPrice: number;
  saasDueDate: number;
  expiresAt: Date | null;
  createdAt: Date;
  _count: {
    users: number;
    orders: number;
    customers: number;
    products: number;
    employees: number;
    appointments: number;
  };
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
    createdAt: Date;
  }[];
  kpis: {
    osLast30: number;
    osLast60: number;
    revenue30: number;
    revenue60: number;
    daysSinceLogin: number;
    healthScore: number;
  };
};

type Note = { id: string; content: string; createdBy: string; createdAt: Date };
type Payment = {
  id: string; month: number; year: number; amount: number;
  status: string; paidAt: Date | null; dueDate: Date;
  tenant: { name: string };
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function HealthBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20"
      : score >= 40
      ? "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/20"
      : "text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20";
  const label = score >= 70 ? "Saud\u00e1vel" : score >= 40 ? "Aten\u00e7\u00e3o" : "Cr\u00edtico";
  return (
    <Badge variant="outline" className={`${color} text-sm font-bold px-3 py-1`}>
      <Heart className="w-3.5 h-3.5 mr-1.5" />
      {score} — {label}
    </Badge>
  );
}

export function ClientTenantDetail({
  tenant,
  notes: initialNotes,
  payments,
}: {
  tenant: TenantDetail;
  notes: Note[];
  payments: Payment[];
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [resetDialog, setResetDialog] = useState<{ userId: string; userName: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isActive, setIsActive] = useState(tenant.isActive);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(
    tenant.expiresAt ? new Date(tenant.expiresAt).toISOString().split("T")[0] : ""
  );
  const [isSavingExpiry, setIsSavingExpiry] = useState(false);

  const tabs = [
    { id: "overview", label: "Vis\u00e3o Geral", icon: Building },
    { id: "users", label: "Usu\u00e1rios", icon: Users },
    { id: "notes", label: "Notas", icon: StickyNote },
    { id: "payments", label: "Pagamentos", icon: CreditCard },
  ];

  const osTrend = tenant.kpis.osLast60 > 0
    ? ((tenant.kpis.osLast30 - tenant.kpis.osLast60) / tenant.kpis.osLast60) * 100
    : tenant.kpis.osLast30 > 0 ? 100 : 0;

  const revTrend = tenant.kpis.revenue60 > 0
    ? ((tenant.kpis.revenue30 - tenant.kpis.revenue60) / tenant.kpis.revenue60) * 100
    : tenant.kpis.revenue30 > 0 ? 100 : 0;

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const note = await addTenantNote(tenant.id, newNote.trim());
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
      toast.success("Nota adicionada!");
    } catch {
      toast.error("Erro ao adicionar nota.");
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    setDeletingNoteId(noteId);
    try {
      await deleteTenantNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Nota removida.");
    } catch {
      toast.error("Erro ao remover nota.");
    } finally {
      setDeletingNoteId(null);
    }
  }

  async function handleResetPassword() {
    if (!resetDialog || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setIsResetting(true);
    try {
      await resetUserPassword(resetDialog.userId, newPassword);
      toast.success(`Senha de ${resetDialog.userName} redefinida!`);
      setResetDialog(null);
      setNewPassword("");
    } catch {
      toast.error("Erro ao redefinir senha.");
    } finally {
      setIsResetting(false);
    }
  }

  async function handleToggleStatus() {
    setIsToggling(true);
    try {
      await toggleTenantStatus(tenant.id, !isActive);
      setIsActive((prev) => !prev);
      toast.success(isActive ? "Oficina bloqueada." : "Oficina ativada.");
    } catch {
      toast.error("Erro ao alterar status.");
    } finally {
      setIsToggling(false);
    }
  }

  async function handleImpersonate(userId: string) {
    setImpersonatingId(userId);
    try {
      const token = await createImpersonationToken(userId);
      window.open(`/api/auth/impersonate?token=${token}`, "_blank");
      toast.success("Sessão de suporte aberta em nova aba.");
    } catch {
      toast.error("Erro ao acessar conta.");
    } finally {
      setImpersonatingId(null);
    }
  }

  async function handleSaveExpiry() {
    setIsSavingExpiry(true);
    try {
      await updateTenantExpiration(tenant.id, expiresAt || null);
      toast.success(expiresAt ? "Data de expiração definida." : "Expiração removida.");
    } catch {
      toast.error("Erro ao salvar expiração.");
    } finally {
      setIsSavingExpiry(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/oficinas">
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="break-all">{tenant.name}</span>
              <Badge
                variant="outline"
                className={`shrink-0 ${
                  isActive
                    ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                    : "text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20"
                }`}
              >
                {isActive ? "Ativa" : "Bloqueada"}
              </Badge>
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {tenant.cnpj || "CNPJ n\u00e3o informado"} · Desde {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <HealthBadge score={tenant.kpis.healthScore} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={isToggling}
            className={isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>{isActive ? "Bloquear" : "Ativar"}</>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OS (30 dias)</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.kpis.osLast30}</div>
            <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${osTrend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {osTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(osTrend).toFixed(0)}% vs per\u00edodo anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (30 dias)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(tenant.kpis.revenue30)}</div>
            <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${revTrend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {revTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(revTrend).toFixed(0)}% vs per\u00edodo anterior
            </p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${tenant.kpis.daysSinceLogin <= 3 ? "border-l-emerald-500" : tenant.kpis.daysSinceLogin <= 7 ? "border-l-yellow-400" : "border-l-red-500"}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">\u00daltimo Acesso</CardTitle>
            <CalendarClock className={`h-4 w-4 ${tenant.kpis.daysSinceLogin <= 3 ? "text-emerald-500" : tenant.kpis.daysSinceLogin <= 7 ? "text-yellow-500" : "text-red-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenant.kpis.daysSinceLogin >= 999 ? "Nunca" : `${tenant.kpis.daysSinceLogin}d`}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {tenant.kpis.daysSinceLogin <= 1 ? "Ativo hoje" : tenant.kpis.daysSinceLogin <= 3 ? "Ativo recentemente" : tenant.kpis.daysSinceLogin <= 7 ? "Pouco ativo" : "Inativo"}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${tenant.kpis.healthScore >= 70 ? "border-l-emerald-500" : tenant.kpis.healthScore >= 40 ? "border-l-yellow-400" : "border-l-red-500"}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className={`h-4 w-4 ${tenant.kpis.healthScore >= 70 ? "text-emerald-500" : tenant.kpis.healthScore >= 40 ? "text-yellow-500" : "text-red-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.kpis.healthScore}/100</div>
            <div className="mt-2 h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  tenant.kpis.healthScore >= 70 ? "bg-emerald-500" : tenant.kpis.healthScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${tenant.kpis.healthScore}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="w-full overflow-x-auto hide-scrollbar bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg p-1">
        <div className="flex w-max min-w-full justify-start md:justify-center bg-transparent gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informa\u00e7\u00f5es do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Plano</span>
                <Badge variant="outline">{tenant.saasPlan}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Mensalidade</span>
                <span className="font-bold">{formatBRL(tenant.saasPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Dia de Vencimento</span>
                <span className="font-semibold">Todo dia {tenant.saasDueDate}</span>
              </div>
              <div className="pt-3 mt-3 border-t dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-sm text-zinc-500 font-medium">Expiração do Contrato</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="flex-1 h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm [color-scheme:light] dark:[color-scheme:dark]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={handleSaveExpiry}
                    disabled={isSavingExpiry}
                  >
                    {isSavingExpiry ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar"}
                  </Button>
                  {expiresAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-red-500 hover:text-red-700"
                      onClick={() => { setExpiresAt(""); handleSaveExpiry(); }}
                    >
                      Remover
                    </Button>
                  )}
                </div>
                {tenant.expiresAt && (
                  <p className={`text-xs font-medium ${new Date(tenant.expiresAt) < new Date() ? "text-red-500" : "text-zinc-400"}`}>
                    {new Date(tenant.expiresAt) < new Date()
                      ? `Expirado em ${new Date(tenant.expiresAt).toLocaleDateString("pt-BR")}`
                      : `Expira em ${new Date(tenant.expiresAt).toLocaleDateString("pt-BR")}`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500">CNPJ:</span>
                <span className="font-medium">{tenant.cnpj || "N\u00e3o informado"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500">Telefone:</span>
                <span className="font-medium">{tenant.phone || "N\u00e3o informado"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500">Endere\u00e7o:</span>
                <span className="font-medium">{tenant.address || "N\u00e3o informado"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Estat\u00edsticas de Uso</CardTitle>
              <CardDescription>N\u00fameros acumulados desde o cadastro.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "Usu\u00e1rios", value: tenant._count.users, icon: Users },
                  { label: "Clientes", value: tenant._count.customers, icon: Users },
                  { label: "Ordens", value: tenant._count.orders, icon: FileText },
                  { label: "Produtos", value: tenant._count.products, icon: Package },
                  { label: "Funcion\u00e1rios", value: tenant._count.employees, icon: HardHat },
                  { label: "Agendamentos", value: tenant._count.appointments, icon: CalendarClock },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                      <Icon className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                      <div className="text-xl font-bold">{stat.value}</div>
                      <div className="text-xs text-zinc-500">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content: Users */}
      {activeTab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usu\u00e1rios da Oficina</CardTitle>
            <CardDescription>{tenant.users.length} usu\u00e1rio{tenant.users.length !== 1 ? "s" : ""} cadastrado{tenant.users.length !== 1 ? "s" : ""}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-zinc-800">
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase">Nome</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase hidden sm:table-cell">Email</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase">Cargo</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase hidden md:table-cell">\u00daltimo Login</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase">A\u00e7\u00f5es</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-zinc-800">
                  {tenant.users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-3 py-3">
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs text-zinc-500 sm:hidden">{u.email}</div>
                      </td>
                      <td className="px-3 py-3 text-zinc-500 hidden sm:table-cell">{u.email}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant="outline" className="text-xs">
                          {u.role === "MANAGER" ? "Gerente" : "Mec\u00e2nico"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-center text-zinc-500 hidden md:table-cell">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("pt-BR") : "Nunca"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setResetDialog({ userId: u.id, userName: u.name })}
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1" /> Resetar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                            onClick={() => handleImpersonate(u.id)}
                            disabled={impersonatingId === u.id}
                          >
                            {impersonatingId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <><ExternalLink className="w-3.5 h-3.5 mr-1" /> <span className="hidden sm:inline">Acessar</span></>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Notes */}
      {activeTab === "notes" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Notas Internas (CRM)
            </CardTitle>
            <CardDescription>Registre intera\u00e7\u00f5es, observa\u00e7\u00f5es e lembretes sobre esta oficina.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add note form */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Escreva uma nota..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <Button onClick={handleAddNote} disabled={isAddingNote || !newNote.trim()} size="sm" className="w-full sm:w-auto shrink-0">
                {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Adicionar</>}
              </Button>
            </div>

            {/* Notes list */}
            <div className="space-y-3">
              {notes.length === 0 && (
                <div className="text-center py-8 text-zinc-400">
                  <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma nota registrada.</p>
                </div>
              )}
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-zinc-400 mt-1.5">
                      {note.createdBy} · {new Date(note.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingNoteId === note.id}
                  >
                    {deletingNoteId === note.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Payments */}
      {activeTab === "payments" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Hist\u00f3rico de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum registro de pagamento ainda.</p>
                <p className="text-xs text-zinc-400 mt-1">Gere as cobran\u00e7as mensais na p\u00e1gina de Faturamento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-zinc-800">
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase">Per\u00edodo</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase">Valor</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase">Vencimento</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase">Status</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-zinc-500 uppercase hidden sm:table-cell">Pago em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-zinc-800">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                        <td className="px-3 py-3 font-medium">
                          {String(p.month).padStart(2, "0")}/{p.year}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">{formatBRL(p.amount)}</td>
                        <td className="px-3 py-3 text-center text-zinc-500">
                          {new Date(p.dueDate).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              p.status === "PAID"
                                ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10"
                                : p.status === "OVERDUE"
                                ? "text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10"
                                : "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10"
                            }`}
                          >
                            {p.status === "PAID" ? "Pago" : p.status === "OVERDUE" ? "Atrasado" : "Pendente"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-center text-zinc-500 text-xs hidden sm:table-cell">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={!!resetDialog} onOpenChange={(open) => { if (!open) { setResetDialog(null); setNewPassword(""); } }}>
        <DialogContent className="w-[95vw] max-w-md bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="p-5 border-b dark:border-zinc-800 text-white bg-orange-600 dark:bg-orange-700">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <KeyRound /> Redefinir Senha
            </DialogTitle>
            <p className="text-orange-100 text-sm mt-1">
              Nova senha para <strong>{resetDialog?.userName}</strong>
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nova Senha</label>
              <Input
                type="text"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t dark:border-zinc-800">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setResetDialog(null); setNewPassword(""); }}>
                Cancelar
              </Button>
              <Button onClick={handleResetPassword} disabled={isResetting || newPassword.length < 6} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white">
                {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Redefinir Senha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS para esconder scrollbar mantendo o scroll */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
