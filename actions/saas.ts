"use server";
// actions/saas.ts — Módulo SaaS: Server Actions restritas ao SUPER_ADMIN

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// ============================================================================
// HELPER: Validação de SUPER_ADMIN
// ============================================================================
async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Acesso negado: apenas SUPER_ADMIN pode executar esta ação.");
  }
  return session;
}

// ============================================================================
// HELPER: Audit Log
// ============================================================================
async function logAudit(
  action: string,
  actorId: string,
  actorName: string,
  metadata?: Record<string, any>,
  tenantId?: string
) {
  await prisma.auditLog.create({
    data: { action, actorId, actorName, metadata: metadata ?? undefined, tenantId },
  });
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================
export async function getSaaSMetrics() {
  await requireSuperAdmin();

  const noAdmin = { NOT: { users: { some: { role: "SUPER_ADMIN" as const } } } };

  const [totalTenants, activeTenants, totalOrders, totalUsers] = await Promise.all([
    prisma.tenant.count({ where: noAdmin }),
    prisma.tenant.count({ where: { isActive: true, ...noAdmin } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" } } }),
  ]);

  const allActive = await prisma.tenant.findMany({
    where: { isActive: true, NOT: noAdmin.NOT },
    select: { saasPrice: true },
  });
  const mrr = allActive.reduce((s, t) => s + t.saasPrice, 0);

  return {
    totalTenants,
    activeTenants,
    blockedTenants: totalTenants - activeTenants,
    mrr,
    arr: mrr * 12,
    totalOrders,
    totalUsers,
  };
}

// ============================================================================
// TENANT CRUD
// ============================================================================
export async function getAllTenants() {
  await requireSuperAdmin();

  const tenants = await prisma.tenant.findMany({
    where: {
      NOT: { users: { some: { role: "SUPER_ADMIN" } } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, orders: true, customers: true, products: true } },
      users: {
        where: { role: { not: "SUPER_ADMIN" } },
        select: { lastLoginAt: true },
        orderBy: { lastLoginAt: "desc" },
        take: 1,
      },
    },
  });

  return tenants.map((t) => {
    const { users, ...rest } = t;
    return {
      ...rest,
      _count: t._count,
      lastActivity: users[0]?.lastLoginAt ?? null,
    };
  });
}

export async function createTenantWithUser(data: {
  tenantName: string;
  cnpj?: string;
  phone?: string;
  managerName: string;
  managerEmail: string;
  managerPassword: string;
  saasPlan?: string;
  saasPrice?: number;
  saasDueDate?: number;
}) {
  const session = await requireSuperAdmin();

  const hashedPassword = await bcrypt.hash(data.managerPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: data.tenantName,
        cnpj: data.cnpj || null,
        phone: data.phone || null,
        saasPlan: data.saasPlan || "Mensal",
        saasPrice: data.saasPrice ?? 147.0,
        saasDueDate: data.saasDueDate ?? 10,
      },
    });

    await tx.user.create({
      data: {
        name: data.managerName,
        email: data.managerEmail,
        password: hashedPassword,
        role: "MANAGER",
        tenantId: tenant.id,
      },
    });

    return tenant;
  });

  await logAudit("TENANT_CREATED", session.user.id, session.user.name ?? "Admin", {
    tenantName: data.tenantName,
    managerEmail: data.managerEmail,
    plan: data.saasPlan || "Mensal",
  }, result.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/oficinas");
  return result;
}

export async function toggleTenantStatus(tenantId: string, isActive: boolean) {
  const session = await requireSuperAdmin();

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { isActive },
    select: { name: true },
  });

  await logAudit(
    isActive ? "TENANT_ACTIVATED" : "TENANT_BLOCKED",
    session.user.id,
    session.user.name ?? "Admin",
    { tenantName: tenant.name, isActive },
    tenantId
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/oficinas");
  revalidatePath("/dashboard/faturamento");
}

export async function updateTenantBilling(
  tenantId: string,
  data: { saasPlan: string; saasPrice: number; saasDueDate: number }
) {
  const session = await requireSuperAdmin();

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      saasPlan: data.saasPlan,
      saasPrice: data.saasPrice,
      saasDueDate: data.saasDueDate,
    },
    select: { name: true },
  });

  await logAudit("BILLING_UPDATED", session.user.id, session.user.name ?? "Admin", {
    tenantName: tenant.name,
    ...data,
  }, tenantId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/oficinas");
  revalidatePath("/dashboard/faturamento");
}

// ============================================================================
// TENANT EXPIRATION
// ============================================================================
export async function updateTenantExpiration(tenantId: string, expiresAt: string | null) {
  const session = await requireSuperAdmin();

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { expiresAt: expiresAt ? new Date(expiresAt) : null },
    select: { name: true },
  });

  // Limpa faturas pendentes de meses APÓS a expiração
  if (expiresAt) {
    const expDate = new Date(expiresAt);
    // Primeiro dia do mês seguinte à expiração
    const cutoff = new Date(expDate.getFullYear(), expDate.getMonth() + 1, 1);

    await prisma.saaSPayment.deleteMany({
      where: {
        tenantId,
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { gte: cutoff },
      },
    });
  }

  await logAudit("TENANT_EXPIRATION_SET", session.user.id, session.user.name ?? "Admin", {
    tenantName: tenant.name,
    expiresAt: expiresAt || "Sem expiração",
  }, tenantId);

  revalidatePath("/dashboard/oficinas");
  revalidatePath("/dashboard/faturamento");
  revalidatePath(`/dashboard/oficinas/${tenantId}`);
}

/**
 * Verifica e bloqueia automaticamente tenants expirados.
 * Chamado no carregamento das páginas de admin.
 */
export async function autoBlockExpiredTenants() {
  const now = new Date();

  const expired = await prisma.tenant.findMany({
    where: {
      isActive: true,
      expiresAt: { lte: now },
      NOT: { users: { some: { role: "SUPER_ADMIN" } } },
    },
    select: { id: true, name: true },
  });

  if (expired.length === 0) return { blocked: 0 };

  await prisma.tenant.updateMany({
    where: { id: { in: expired.map((t) => t.id) } },
    data: { isActive: false },
  });

  for (const t of expired) {
    await logAudit("TENANT_AUTO_BLOCKED", "system", "Sistema", {
      tenantName: t.name,
      reason: "Contrato expirado",
    }, t.id);
  }

  return { blocked: expired.length };
}

// ============================================================================
// TENANT DETAIL & HEALTH SCORE
// ============================================================================
export async function getTenantDetail(tenantId: string) {
  await requireSuperAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: {
          users: true, orders: true, customers: true,
          products: true, employees: true, appointments: true,
        },
      },
      users: {
        where: { role: { not: "SUPER_ADMIN" } },
        select: { id: true, name: true, email: true, role: true, lastLoginAt: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tenant) throw new Error("Oficina não encontrada.");

  // KPIs do tenant
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [osLast30, osLast60, revenueLast30, revenueLast60] = await Promise.all([
    prisma.order.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.count({ where: { tenantId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.financialTransaction.aggregate({
      where: { tenantId, type: "INCOME", status: "PAID", paymentDate: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: { tenantId, type: "INCOME", status: "PAID", paymentDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
  ]);

  const revenue30 = revenueLast30._sum.amount ?? 0;
  const revenue60 = revenueLast60._sum.amount ?? 0;

  // Health Score (0-100)
  const lastLogin = tenant.users
    .map((u) => u.lastLoginAt)
    .filter(Boolean)
    .sort((a, b) => (b?.getTime() ?? 0) - (a?.getTime() ?? 0))[0];

  const daysSinceLogin = lastLogin
    ? Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  let score = 100;
  // -30 se sem login há +14 dias, -15 se +7 dias
  if (daysSinceLogin > 14) score -= 30;
  else if (daysSinceLogin > 7) score -= 15;
  // -25 se nenhuma OS nos últimos 30 dias
  if (osLast30 === 0) score -= 25;
  // -20 se receita caiu mais de 50%
  if (revenue60 > 0 && revenue30 < revenue60 * 0.5) score -= 20;
  // -10 se sem clientes cadastrados
  if (tenant._count.customers === 0) score -= 10;
  // Clamp
  score = Math.max(0, Math.min(100, score));

  return {
    ...tenant,
    kpis: {
      osLast30,
      osLast60,
      revenue30,
      revenue60,
      daysSinceLogin,
      healthScore: score,
    },
  };
}

// ============================================================================
// TENANT NOTES (CRM-lite)
// ============================================================================
export async function addTenantNote(tenantId: string, content: string) {
  const session = await requireSuperAdmin();

  const note = await prisma.tenantNote.create({
    data: {
      tenantId,
      content,
      createdBy: session.user.name ?? "Admin",
    },
  });

  await logAudit("NOTE_ADDED", session.user.id, session.user.name ?? "Admin", {
    noteId: note.id,
  }, tenantId);

  revalidatePath(`/dashboard/oficinas/${tenantId}`);
  return note;
}

export async function getTenantNotes(tenantId: string) {
  await requireSuperAdmin();
  return prisma.tenantNote.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteTenantNote(noteId: string) {
  const session = await requireSuperAdmin();

  const note = await prisma.tenantNote.delete({ where: { id: noteId } });

  await logAudit("NOTE_DELETED", session.user.id, session.user.name ?? "Admin", {
    noteId,
  }, note.tenantId);

  revalidatePath(`/dashboard/oficinas/${note.tenantId}`);
}

// ============================================================================
// TENANT USER MANAGEMENT
// ============================================================================
export async function getTenantUsers(tenantId: string) {
  await requireSuperAdmin();
  return prisma.user.findMany({
    where: { tenantId, role: { not: "SUPER_ADMIN" } },
    select: { id: true, name: true, email: true, role: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await requireSuperAdmin();

  const hashed = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
    select: { name: true, email: true, tenantId: true },
  });

  await logAudit("PASSWORD_RESET", session.user.id, session.user.name ?? "Admin", {
    userName: user.name,
    userEmail: user.email,
  }, user.tenantId);

  return { success: true };
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================
export async function createAnnouncement(data: {
  title: string;
  body: string;
  type?: string;
  expiresAt?: string;
}) {
  const session = await requireSuperAdmin();

  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      body: data.body,
      type: data.type || "info",
      isGlobal: true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdBy: session.user.name ?? "Admin",
    },
  });

  await logAudit("ANNOUNCEMENT_CREATED", session.user.id, session.user.name ?? "Admin", {
    title: data.title,
    type: data.type,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/comunicados");
  return announcement;
}

export async function getAnnouncements() {
  await requireSuperAdmin();
  return prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getActiveAnnouncements() {
  const now = new Date();
  return prisma.announcement.findMany({
    where: {
      startsAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteAnnouncement(id: string) {
  const session = await requireSuperAdmin();

  await prisma.announcement.delete({ where: { id } });

  await logAudit("ANNOUNCEMENT_DELETED", session.user.id, session.user.name ?? "Admin", {
    announcementId: id,
  });

  revalidatePath("/dashboard/comunicados");
}

// ============================================================================
// SAAS PAYMENT MANAGEMENT
// ============================================================================

/**
 * Auto-garante que todos os pagamentos esperados existam no banco.
 * Gera 12 meses à frente para cada tenant ativo, respeitando:
 * - createdAt: não gera meses antes da criação
 * - expiresAt: não gera meses após expiração
 * Usa createMany + skipDuplicates (1 query otimizada).
 * Também auto-marca PENDING → OVERDUE se vencido.
 */
export async function autoEnsurePayments() {
  const now = new Date();
  const MONTHS_AHEAD = 12;

  const activeTenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
      NOT: { users: { some: { role: "SUPER_ADMIN" as const } } },
    },
    select: { id: true, saasPrice: true, saasDueDate: true, expiresAt: true, createdAt: true },
  });

  const data: {
    tenantId: string;
    month: number;
    year: number;
    amount: number;
    dueDate: Date;
    status: string;
  }[] = [];

  for (const t of activeTenants) {
    const createdMonth = new Date(t.createdAt.getFullYear(), t.createdAt.getMonth(), 1);

    for (let offset = 0; offset < MONTHS_AHEAD; offset++) {
      const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const month = target.getMonth() + 1;
      const year = target.getFullYear();

      // Não gera meses antes da criação do tenant
      if (target < createdMonth) continue;

      // Não gera meses após a expiração do contrato
      if (t.expiresAt) {
        const expiryLimit = new Date(t.expiresAt.getFullYear(), t.expiresAt.getMonth(), 1);
        if (target > expiryLimit) continue;
      }

      const dueDate = new Date(year, month - 1, t.saasDueDate);

      data.push({
        tenantId: t.id,
        month,
        year,
        amount: t.saasPrice,
        dueDate,
        status: dueDate < now ? "OVERDUE" : "PENDING",
      });
    }
  }

  let created = 0;
  if (data.length > 0) {
    const result = await prisma.saaSPayment.createMany({
      data,
      skipDuplicates: true,
    });
    created = result.count;
  }

  // Auto-marca PENDING vencidos como OVERDUE
  await prisma.saaSPayment.updateMany({
    where: { status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  // Limpeza: remove faturas pendentes de tenants expirados (meses após expiração)
  const expiredTenants = await prisma.tenant.findMany({
    where: {
      expiresAt: { not: null },
      NOT: { users: { some: { role: "SUPER_ADMIN" as const } } },
    },
    select: { id: true, expiresAt: true },
  });

  for (const t of expiredTenants) {
    if (!t.expiresAt) continue;
    const cutoff = new Date(t.expiresAt.getFullYear(), t.expiresAt.getMonth() + 1, 1);
    await prisma.saaSPayment.deleteMany({
      where: {
        tenantId: t.id,
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { gte: cutoff },
      },
    });
  }

  return { created, total: activeTenants.length };
}

/**
 * Botão manual "Gerar Cobranças" — wrapper com audit log.
 */
export async function generateMonthlyPayments() {
  const session = await requireSuperAdmin();
  const result = await autoEnsurePayments();

  await logAudit("PAYMENTS_GENERATED", session.user.id, session.user.name ?? "Admin", {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    created: result.created,
    total: result.total,
  });

  revalidatePath("/dashboard/faturamento");
  return result;
}

export async function markPaymentStatus(
  paymentId: string,
  status: string,
  paidAt?: string
) {
  const session = await requireSuperAdmin();

  const payment = await prisma.saaSPayment.update({
    where: { id: paymentId },
    data: {
      status,
      paidAt: status === "PAID" ? (paidAt ? new Date(paidAt) : new Date()) : null,
    },
    select: { tenantId: true, month: true, year: true, tenant: { select: { name: true } } },
  });

  await logAudit("PAYMENT_STATUS_CHANGED", session.user.id, session.user.name ?? "Admin", {
    tenantName: payment.tenant.name,
    month: payment.month,
    year: payment.year,
    newStatus: status,
  }, payment.tenantId);

  revalidatePath("/dashboard/faturamento");
}

export async function getPaymentHistory(tenantId?: string) {
  await requireSuperAdmin();

  const where = tenantId ? { tenantId } : {};
  return prisma.saaSPayment.findMany({
    where,
    include: { tenant: { select: { name: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================
export async function bulkToggleStatus(tenantIds: string[], isActive: boolean) {
  const session = await requireSuperAdmin();

  await prisma.tenant.updateMany({
    where: { id: { in: tenantIds } },
    data: { isActive },
  });

  await logAudit(
    isActive ? "BULK_ACTIVATE" : "BULK_BLOCK",
    session.user.id,
    session.user.name ?? "Admin",
    { tenantIds, count: tenantIds.length, isActive }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/oficinas");
  revalidatePath("/dashboard/faturamento");
}

// ============================================================================
// EXPORT CSV
// ============================================================================
export async function exportTenantsCSV() {
  await requireSuperAdmin();

  const tenants = await prisma.tenant.findMany({
    where: { NOT: { users: { some: { role: "SUPER_ADMIN" } } } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, orders: true, customers: true } } },
  });

  const header = "Nome;CNPJ;Telefone;Plano;Mensalidade;Vencimento;Status;Usuarios;OS;Clientes;Criado Em";
  const rows = tenants.map((t) =>
    [
      t.name,
      t.cnpj || "",
      t.phone || "",
      t.saasPlan,
      t.saasPrice.toFixed(2).replace(".", ","),
      t.saasDueDate,
      t.isActive ? "Ativa" : "Bloqueada",
      t._count.users,
      t._count.orders,
      t._count.customers,
      new Date(t.createdAt).toLocaleDateString("pt-BR"),
    ].join(";")
  );

  return [header, ...rows].join("\n");
}

// ============================================================================
// AUDIT LOG VIEWER
// ============================================================================
export async function getAuditLogs(page = 1, limit = 30) {
  await requireSuperAdmin();

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);

  return { logs, total, pages: Math.ceil(total / limit) };
}

// ============================================================================
// IMPERSONATION
// ============================================================================
import { signImpersonationToken } from "@/lib/impersonation";

export async function createImpersonationToken(userId: string) {
  const session = await requireSuperAdmin();
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Configuração de segurança ausente.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, tenantId: true, tenant: { select: { name: true } } },
  });
  if (!user) throw new Error("Usuário não encontrado.");

  const token = signImpersonationToken(user.id, secret);

  await logAudit("IMPERSONATION", session.user.id, session.user.name ?? "Admin", {
    targetUser: user.name,
    targetEmail: user.email,
    tenantName: user.tenant.name,
  }, user.tenantId);

  return token;
}

// ============================================================================
// SAAS FIXED EXPENSES (Custos Fixos SaaS: Hosting, Servidores, etc.)
// ============================================================================
export async function getSaaSFixedExpenses() {
  const session = await requireSuperAdmin();
  return prisma.fixedExpense.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { dueDay: "asc" },
  });
}

export async function createSaaSFixedExpense(data: {
  title: string;
  category: string;
  amount: number;
  dueDay: number;
}) {
  const session = await requireSuperAdmin();

  const expense = await prisma.fixedExpense.create({
    data: {
      title: data.title,
      category: data.category,
      amount: data.amount,
      dueDay: data.dueDay,
      tenantId: session.user.tenantId,
    },
  });

  await logAudit("FIXED_EXPENSE_CREATED", session.user.id, session.user.name ?? "Admin", {
    title: data.title,
    amount: data.amount,
  });

  revalidatePath("/dashboard/faturamento");
  return expense;
}

export async function updateSaaSFixedExpense(id: string, data: {
  title: string;
  category: string;
  amount: number;
  dueDay: number;
}) {
  const session = await requireSuperAdmin();

  await prisma.fixedExpense.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category,
      amount: data.amount,
      dueDay: data.dueDay,
    },
  });

  // Atualiza apenas os lançamentos FUTUROS pendentes com o novo valor
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  await prisma.saaSExpensePayment.updateMany({
    where: {
      fixedExpenseId: id,
      status: { not: "PAID" },
      OR: [
        { year: { gt: currentYear } },
        { year: currentYear, month: { gte: currentMonth } },
      ],
    },
    data: { amount: data.amount },
  });

  await logAudit("FIXED_EXPENSE_UPDATED", session.user.id, session.user.name ?? "Admin", {
    expenseId: id,
    title: data.title,
    amount: data.amount,
  });

  revalidatePath("/dashboard/faturamento");
}

export async function deleteSaaSFixedExpense(id: string) {
  const session = await requireSuperAdmin();

  await prisma.fixedExpense.delete({ where: { id } });

  await logAudit("FIXED_EXPENSE_DELETED", session.user.id, session.user.name ?? "Admin", {
    expenseId: id,
  });

  revalidatePath("/dashboard/faturamento");
}

// ============================================================================
// SAAS EXPENSE PAYMENTS (Contas a Pagar mensais geradas dos custos fixos)
// ============================================================================

/**
 * Auto-gera registros mensais de despesa para cada custo fixo.
 * 12 meses à frente, com createMany + skipDuplicates.
 * Também marca PENDING vencidos como OVERDUE.
 */
export async function autoEnsureExpensePayments(tenantId: string) {
  const now = new Date();
  const MONTHS_AHEAD = 12;

  const expenses = await prisma.fixedExpense.findMany({
    where: { tenantId },
    select: { id: true, title: true, category: true, amount: true, dueDay: true },
  });

  if (expenses.length === 0) return;

  const data: {
    fixedExpenseId: string;
    title: string;
    category: string;
    month: number;
    year: number;
    amount: number;
    status: string;
  }[] = [];

  for (const exp of expenses) {
    for (let offset = 0; offset < MONTHS_AHEAD; offset++) {
      const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const month = target.getMonth() + 1;
      const year = target.getFullYear();
      const dueDate = new Date(year, month - 1, exp.dueDay);

      data.push({
        fixedExpenseId: exp.id,
        title: exp.title,
        category: exp.category,
        month,
        year,
        amount: exp.amount,
        status: dueDate < now ? "OVERDUE" : "PENDING",
      });
    }
  }

  if (data.length > 0) {
    await prisma.saaSExpensePayment.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // Auto-marca vencidos
  const expenseIds = expenses.map((e) => e.id);
  // Marca como OVERDUE os que já venceram (dueDay do mês atual já passou, ou meses anteriores)
  const allPending = await prisma.saaSExpensePayment.findMany({
    where: {
      fixedExpenseId: { in: expenseIds },
      status: "PENDING",
    },
    include: { fixedExpense: { select: { dueDay: true } } },
  });

  const overdueIds = allPending
    .filter((p) => {
      const dueDate = new Date(p.year, p.month - 1, p.fixedExpense.dueDay);
      return dueDate < now;
    })
    .map((p) => p.id);

  if (overdueIds.length > 0) {
    await prisma.saaSExpensePayment.updateMany({
      where: { id: { in: overdueIds } },
      data: { status: "OVERDUE" },
    });
  }
}

export async function markExpensePaymentStatus(
  paymentId: string,
  status: string
) {
  await requireSuperAdmin();

  await prisma.saaSExpensePayment.update({
    where: { id: paymentId },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });

  revalidatePath("/dashboard/faturamento");
}

export async function deleteExpensePayment(paymentId: string) {
  await requireSuperAdmin();
  await prisma.saaSExpensePayment.delete({ where: { id: paymentId } });
  revalidatePath("/dashboard/faturamento");
}

export async function generateSaaSExpensePaymentsForMonth(targetMonth: number, targetYear: number) {
  const session = await requireSuperAdmin();
  const tenantId = session.user.tenantId;

  const expenses = await prisma.fixedExpense.findMany({
    where: { tenantId },
    select: { id: true, title: true, category: true, amount: true },
  });

  if (expenses.length === 0) return 0;

  const result = await prisma.saaSExpensePayment.createMany({
    data: expenses.map((exp) => ({
      fixedExpenseId: exp.id,
      title: exp.title,
      category: exp.category,
      month: targetMonth,
      year: targetYear,
      amount: exp.amount,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/dashboard/faturamento");
  return result.count;
}
