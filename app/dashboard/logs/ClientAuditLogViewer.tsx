"use client";
// app/dashboard/logs/ClientAuditLogViewer.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ScrollText, ChevronLeft, ChevronRight, Building,
  Ban, CheckCircle2, KeyRound, StickyNote, Megaphone,
  DollarSign, Users, CreditCard, Plus, Trash2, Shield,
} from "lucide-react";

type AuditLog = {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  metadata: any;
  tenantId: string | null;
  createdAt: Date;
};

const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
  TENANT_CREATED: { label: "Oficina Criada", color: "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10", icon: Plus },
  TENANT_BLOCKED: { label: "Oficina Bloqueada", color: "text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10", icon: Ban },
  TENANT_ACTIVATED: { label: "Oficina Ativada", color: "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle2 },
  BILLING_UPDATED: { label: "Cobrança Alterada", color: "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10", icon: DollarSign },
  PASSWORD_RESET: { label: "Senha Redefinida", color: "text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-500/10", icon: KeyRound },
  NOTE_ADDED: { label: "Nota Adicionada", color: "text-violet-600 border-violet-200 bg-violet-50 dark:bg-violet-500/10", icon: StickyNote },
  NOTE_DELETED: { label: "Nota Removida", color: "text-zinc-600 border-zinc-200 bg-zinc-50 dark:bg-zinc-500/10", icon: Trash2 },
  ANNOUNCEMENT_CREATED: { label: "Comunicado Publicado", color: "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10", icon: Megaphone },
  ANNOUNCEMENT_DELETED: { label: "Comunicado Removido", color: "text-zinc-600 border-zinc-200 bg-zinc-50 dark:bg-zinc-500/10", icon: Trash2 },
  PAYMENTS_GENERATED: { label: "Cobranças Geradas", color: "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10", icon: CreditCard },
  PAYMENT_STATUS_CHANGED: { label: "Pagamento Atualizado", color: "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10", icon: CreditCard },
  BULK_ACTIVATE: { label: "Ativação em Lote", color: "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10", icon: Shield },
  BULK_BLOCK: { label: "Bloqueio em Lote", color: "text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10", icon: Shield },
  TENANT_EXPIRATION_SET: { label: "Expiração Definida", color: "text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-500/10", icon: Ban },
  TENANT_AUTO_BLOCKED: { label: "Auto-Bloqueio", color: "text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10", icon: Ban },
  IMPERSONATION: { label: "Acesso Suporte", color: "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10", icon: KeyRound },
  FIXED_EXPENSE_CREATED: { label: "Custo Fixo Criado", color: "text-violet-600 border-violet-200 bg-violet-50 dark:bg-violet-500/10", icon: DollarSign },
  FIXED_EXPENSE_DELETED: { label: "Custo Fixo Removido", color: "text-zinc-600 border-zinc-200 bg-zinc-50 dark:bg-zinc-500/10", icon: Trash2 },
};

function getMetadataDescription(action: string, metadata: any): string {
  if (!metadata) return "";
  switch (action) {
    case "TENANT_CREATED": return `${metadata.tenantName} (${metadata.managerEmail})`;
    case "TENANT_BLOCKED":
    case "TENANT_ACTIVATED": return metadata.tenantName || "";
    case "BILLING_UPDATED": return `${metadata.tenantName}: ${metadata.saasPlan} R$${metadata.saasPrice}`;
    case "PASSWORD_RESET": return `${metadata.userName} (${metadata.userEmail})`;
    case "PAYMENTS_GENERATED": return `${metadata.created}/${metadata.total} cobranças (${metadata.month}/${metadata.year})`;
    case "PAYMENT_STATUS_CHANGED": {
      const statusMap: Record<string, string> = { PAID: "Pago", PENDING: "Pendente", OVERDUE: "Atrasado" };
      return `${metadata.tenantName}: ${statusMap[metadata.newStatus] || metadata.newStatus} (${metadata.month}/${metadata.year})`;
    }
    case "BULK_ACTIVATE":
    case "BULK_BLOCK": return `${metadata.count} oficina(s)`;
    case "ANNOUNCEMENT_CREATED": return metadata.title || "";
    case "TENANT_EXPIRATION_SET": return `${metadata.tenantName}: ${metadata.expiresAt}`;
    case "TENANT_AUTO_BLOCKED": return `${metadata.tenantName} (${metadata.reason})`;
    case "IMPERSONATION": return `${metadata.targetUser} (${metadata.targetEmail})`;
    default: return JSON.stringify(metadata).slice(0, 80);
  }
}

export function ClientAuditLogViewer({
  data,
  currentPage,
}: {
  data: { logs: AuditLog[]; total: number; pages: number };
  currentPage: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h2>
        <p className="text-sm text-zinc-500 mt-1">Histórico de todas as ações administrativas no sistema.</p>
      </div>

      <Card>
        <CardHeader className="border-b dark:border-zinc-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="w-4 h-4" /> Registro de Atividades
              </CardTitle>
              <CardDescription>{data.total} eventos registrados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {data.logs.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum log registrado.</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-zinc-800">
              {data.logs.map((log) => {
                const cfg = actionConfig[log.action] || {
                  label: log.action,
                  color: "text-zinc-600 border-zinc-200 bg-zinc-50 dark:bg-zinc-500/10",
                  icon: ScrollText,
                };
                const Icon = cfg.icon;
                const desc = getMetadataDescription(log.action, log.metadata);

                return (
                  <div key={log.id} className="flex items-start gap-3 py-3">
                    <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${log.action.includes("BLOCK") || log.action.includes("DELETE") ? "bg-red-100 dark:bg-red-950/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                      <Icon className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-zinc-400">por {log.actorName}</span>
                      </div>
                      {desc && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 truncate">{desc}</p>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 shrink-0 hidden sm:block">
                      {new Date(log.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t dark:border-zinc-800">
              <span className="text-xs text-zinc-500">
                Página {currentPage} de {data.pages}
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                {currentPage > 1 && (
                  <Link href={`/dashboard/logs?page=${currentPage - 1}`} className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="h-8 gap-1 w-full">
                      <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                    </Button>
                  </Link>
                )}
                {currentPage < data.pages && (
                  <Link href={`/dashboard/logs?page=${currentPage + 1}`} className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="h-8 gap-1 w-full">
                      Próximo <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
