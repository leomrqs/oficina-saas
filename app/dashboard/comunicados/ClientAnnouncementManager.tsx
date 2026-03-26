"use client";
// app/dashboard/comunicados/ClientAnnouncementManager.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Megaphone, Plus, Loader2, Trash2, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { createAnnouncement, deleteAnnouncement } from "@/actions/saas";

type Announcement = {
  id: string;
  title: string;
  body: string;
  type: string;
  isGlobal: boolean;
  startsAt: Date;
  expiresAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
};

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  info: { label: "Informativo", color: "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20", icon: Info },
  warning: { label: "Aviso", color: "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/20", icon: AlertTriangle },
  critical: { label: "Crítico", color: "text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20", icon: AlertCircle },
};

export function ClientAnnouncementManager({ announcements: initial }: { announcements: Announcement[] }) {
  const [announcements, setAnnouncements] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "", type: "info", expiresAt: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setIsCreating(true);
    try {
      const result = await createAnnouncement({
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        expiresAt: form.expiresAt || undefined,
      });
      setAnnouncements((prev) => [result as Announcement, ...prev]);
      setShowCreate(false);
      setForm({ title: "", body: "", type: "info", expiresAt: "" });
      toast.success("Comunicado publicado!");
    } catch {
      toast.error("Erro ao criar comunicado.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Comunicado removido.");
    } catch {
      toast.error("Erro ao remover.");
    } finally {
      setDeletingId(null);
    }
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Comunicados</h2>
          <p className="text-sm text-zinc-500 mt-1">Crie avisos que aparecem no painel de todas as oficinas.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Novo Comunicado
        </Button>
      </div>

      {announcements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum comunicado publicado.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {announcements.map((a) => {
          const cfg = typeConfig[a.type] || typeConfig.info;
          const Icon = cfg.icon;
          const isExpired = a.expiresAt && new Date(a.expiresAt) < now;
          return (
            <Card key={a.id} className={`transition-all ${isExpired ? "opacity-50" : ""}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-md shrink-0 ${a.type === "critical" ? "bg-red-100 dark:bg-red-950/30" : a.type === "warning" ? "bg-yellow-100 dark:bg-yellow-950/30" : "bg-blue-100 dark:bg-blue-950/30"}`}>
                    <Icon className={`w-4 h-4 ${a.type === "critical" ? "text-red-600" : a.type === "warning" ? "text-yellow-600" : "text-blue-600"}`} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      {a.title}
                      <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                      {isExpired && (
                        <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-200">Expirado</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 whitespace-pre-wrap">{a.body}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                >
                  {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-zinc-400">
                  Por {a.createdBy || "Sistema"} · {new Date(a.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  {a.expiresAt && ` · Expira em ${new Date(a.expiresAt).toLocaleDateString("pt-BR")}`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="w-[95vw] max-w-xl bg-zinc-50 dark:bg-zinc-950 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 rounded-xl">
          <div className="p-5 border-b dark:border-zinc-800 text-white bg-blue-600 dark:bg-blue-700">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Megaphone /> Novo Comunicado
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">
              Será exibido como banner no painel de todas as oficinas.
            </DialogDescription>
          </div>
          <form onSubmit={handleCreate} className="p-5 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Título *</label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Manutenção programada" className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mensagem *</label>
              <textarea
                required
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Descreva o comunicado..."
                className="w-full min-h-[100px] rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-12 dark:bg-zinc-900 dark:border-zinc-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                    <SelectItem value="info">Informativo</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Expira em (opcional)</label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="h-12 dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t dark:border-zinc-800">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={isCreating} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publicando...</> : "Publicar Comunicado"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
