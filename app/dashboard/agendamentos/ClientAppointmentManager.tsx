// app/dashboard/agendamentos/ClientAppointmentManager.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CalendarDays, Plus, Clock, Car, User, FileText, CheckCircle2, Trash2,
  ArrowRight, Phone, Calendar as CalendarIcon, MessageCircle, AlertTriangle,
  Loader2, Wrench, ExternalLink, ChevronDown, ChevronUp, SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { createAppointment, updateAppointmentStatus, deleteAppointment, generateOSFromAppointment } from "@/actions/appointments";
import { toast } from "sonner";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; badge: string; glow: string }> = {
  SCHEDULED: {
    label: "Marcado",
    color: "border-l-blue-500",
    dot: "bg-blue-500",
    badge: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400",
    glow: "shadow-blue-500/20 dark:shadow-blue-500/15",
  },
  CONFIRMED: {
    label: "Confirmado",
    color: "border-l-emerald-500",
    dot: "bg-emerald-500",
    badge: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
    glow: "shadow-emerald-500/20 dark:shadow-emerald-500/15",
  },
  COMPLETED: {
    label: "OS Gerada",
    color: "border-l-zinc-400",
    dot: "bg-zinc-400",
    badge: "text-zinc-500 bg-zinc-100 border-zinc-200 dark:bg-zinc-500/10 dark:border-zinc-500/20 dark:text-zinc-400",
    glow: "shadow-zinc-400/15 dark:shadow-zinc-400/10",
  },
  NO_SHOW: {
    label: "Faltou",
    color: "border-l-orange-400",
    dot: "bg-orange-400",
    badge: "text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400",
    glow: "shadow-orange-500/20 dark:shadow-orange-500/15",
  },
  CANCELED: {
    label: "Cancelado",
    color: "border-l-red-400",
    dot: "bg-red-400",
    badge: "text-red-700 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400",
    glow: "shadow-red-500/20 dark:shadow-red-500/15",
  },
};

const OS_STATUS_LABEL: Record<string, string> = {
  PENDING: "Orçamento",
  APPROVED: "Aprovado",
  WAITING_PARTS: "Aguard. Peça",
  IN_PROGRESS: "No Elevador",
  READY: "Pronto",
  COMPLETED: "Finalizada",
  CANCELED: "Cancelada",
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, badge: "", glow: "", dot: "bg-zinc-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap shadow-md ${cfg.badge} ${cfg.glow}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function ClientAppointmentManager({
  appointments,
  customers,
  unlinkedOrders,
}: {
  appointments: any[];
  customers: any[];
  unlinkedOrders: any[];
}) {
  // ─── Date helpers ──────────────────────────────────────────────────────────
  const formatLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const getMonday = (d: Date) => {
    const dt = new Date(d);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(dt.setDate(diff));
  };
  const getSunday = (d: Date) => {
    const monday = getMonday(d);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  };

  // ─── Filter state ──────────────────────────────────────────────────────────
  const [filterType, setFilterType] = useState<"TODAY" | "WEEK" | "MONTH" | "CUSTOM">("WEEK");
  const [customDate, setCustomDate] = useState<string>(formatLocal(new Date()));
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showCustomDate, setShowCustomDate] = useState(false);

  // ─── Modal / form state ────────────────────────────────────────────────────
  const [openNewModal, setOpenNewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingOS, setIsGeneratingOS] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(formatLocal(new Date()));
  const [formTime, setFormTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedOrder, setSelectedOrder] = useState("");
  const [notes, setNotes] = useState("");

  const customerVehicles = useMemo(
    () => customers.find((c) => c.id === selectedCustomer)?.vehicles || [],
    [selectedCustomer, customers]
  );
  const availableOrders = useMemo(
    () =>
      selectedCustomer
        ? unlinkedOrders.filter((o) => o.customerId === selectedCustomer)
        : unlinkedOrders,
    [selectedCustomer, unlinkedOrders]
  );
  const conflictingAppointment = useMemo(() => {
    if (!formDate || !formTime) return null;
    return appointments.find((app) => {
      const appDateStr = new Date(app.date).toISOString().split("T")[0];
      return (
        appDateStr === formDate &&
        app.time === formTime &&
        app.status !== "CANCELED" &&
        app.status !== "NO_SHOW"
      );
    });
  }, [formDate, formTime, appointments]);

  // ─── Update date range ─────────────────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    if (filterType === "TODAY") {
      const today = formatLocal(now);
      setDateRange({ start: today, end: today });
    } else if (filterType === "WEEK") {
      setDateRange({ start: formatLocal(getMonday(now)), end: formatLocal(getSunday(now)) });
    } else if (filterType === "MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({ start: formatLocal(firstDay), end: formatLocal(lastDay) });
    } else {
      setDateRange({ start: customDate, end: customDate });
    }
  }, [filterType, customDate]);

  // ─── Grouped appointments ──────────────────────────────────────────────────
  const groupedAppointments = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    const filtered = appointments.filter((app) => {
      const appDateStr = new Date(app.date).toISOString().split("T")[0];
      return appDateStr >= dateRange.start && appDateStr <= dateRange.end;
    });
    const groups: Record<string, any[]> = {};
    filtered.forEach((app) => {
      const dateStr = new Date(app.date).toISOString().split("T")[0];
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(app);
    });
    const sortedKeys = Object.keys(groups).sort();
    return sortedKeys.map((key) => {
      const dateObj = new Date(`${key}T12:00:00Z`);
      const isToday = key === formatLocal(new Date());
      let dateFormatted = dateObj.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        timeZone: "UTC",
      });
      dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
      return {
        dateStr: key,
        dateFormatted: isToday ? `Hoje — ${dateFormatted}` : dateFormatted,
        isToday,
        appointments: groups[key].sort((a, b) => a.time.localeCompare(b.time)),
      };
    });
  }, [appointments, dateRange]);

  const totalCount = groupedAppointments.reduce((acc, g) => acc + g.appointments.length, 0);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!selectedCustomer || !formDate || !formTime)
      return toast.error("Preencha cliente, data e hora inicial.");
    try {
      setIsSubmitting(true);
      await createAppointment({
        customerId: selectedCustomer,
        vehicleId: selectedVehicle || undefined,
        orderId: selectedOrder || undefined,
        date: formDate,
        time: formTime,
        endTime: formEndTime || undefined,
        notes,
      });
      toast.success(selectedOrder ? "Agendamento criado e OS vinculada!" : "Agendamento criado!");
      setOpenNewModal(false);
      setSelectedCustomer("");
      setSelectedVehicle("");
      setSelectedOrder("");
      setNotes("");
      setFormEndTime("");
    } catch {
      toast.error("Erro ao agendar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrder(orderId);
    if (orderId) {
      const order = unlinkedOrders.find((o) => o.id === orderId);
      if (order?.vehicle) {
        const vehicle = customerVehicles.find((v: any) => v.plate === order.vehicle.plate);
        if (vehicle) setSelectedVehicle(vehicle.id);
      }
    }
  };

  const handleStatus = async (id: string, status: any) => {
    try {
      await updateAppointmentStatus(id, status);
      toast.success("Status atualizado.");
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const handleGenerateOS = async (id: string) => {
    if (
      !confirm(
        "Deseja gerar uma OS de Orçamento para este agendamento? Ele será marcado como 'OS Gerada'."
      )
    )
      return;
    try {
      setIsGeneratingOS(id);
      await generateOSFromAppointment(id);
      toast.success(
        "OS Gerada com sucesso! Vá para a tela de Pátio ou Orçamentos para adicionar peças."
      );
    } catch {
      toast.error("Erro ao gerar OS. O agendamento tem veículo atrelado?");
    } finally {
      setIsGeneratingOS(null);
    }
  };

  const handleWhatsAppReminder = (app: any) => {
    if (!app.customer.phone) return toast.error("Cliente sem telefone cadastrado.");
    const rawDate = new Date(app.date).toISOString().split("T")[0];
    const dateObj = new Date(`${rawDate}T12:00:00Z`);
    const dateFormatted = dateObj.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    });
    const vehicleStr = app.vehicle
      ? `${app.vehicle.brand} ${app.vehicle.model}`
      : "veículo";
    const timeStr = app.endTime ? `${app.time} às ${app.endTime}` : app.time;
    const phone = app.customer.phone.replace(/\D/g, "");
    const phoneClean = phone.startsWith("55") && phone.length >= 12 ? phone : `55${phone}`;
    const msg = `Olá *${app.customer.name}*, tudo bem?\nPassando para lembrar e confirmar seu agendamento conosco.\n\n📅 *Data:* ${dateFormatted}\n⏰ *Horário:* ${timeStr}\n🚗 *Veículo:* ${vehicleStr}\n\nPodemos confirmar sua presença?`;
    window.open(
      `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  return (
    <div className="space-y-5">

      {/* ── FILTER BAR — estilo dashboard ────────────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-top-1 duration-400">
        <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">

          {/* Top row: chips + custom toggle + new appointment CTA */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
            <div
              className="flex items-center gap-1.5 overflow-x-auto flex-1 pb-0.5"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {([
                { key: "TODAY", label: "Hoje", short: "Hoje" },
                { key: "WEEK",  label: "Esta Semana", short: "Semana" },
                { key: "MONTH", label: "Este Mês", short: "Mês" },
              ] as const).map(({ key, label, short }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`shrink-0 h-7 px-3 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap border ${
                    filterType === key
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25"
                      : "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{short}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowCustomDate((v) => !v)}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  showCustomDate || filterType === "CUSTOM"
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                    : "text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Data</span>
                {showCustomDate ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button
                onClick={() => { setFormDate(customDate || formatLocal(new Date())); setOpenNewModal(true); }}
                className="relative flex items-center gap-1.5 h-7 px-4 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-200 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo Agendamento</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>

          {/* Custom date expandable */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              showCustomDate ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 px-3 pb-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">Data</span>
              <Input
                type="date"
                value={customDate}
                onChange={(e) => { setCustomDate(e.target.value); setFilterType("CUSTOM"); }}
                className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-lg [color-scheme:light] dark:[color-scheme:dark] w-[140px]"
              />
              <Button
                size="sm"
                onClick={() => { setFilterType("CUSTOM"); setShowCustomDate(false); }}
                className="h-8 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 gap-1.5 px-3"
              >
                <SlidersHorizontal className="w-3 h-3" />
                Filtrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCHEDULE BOARD ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-900/50 animate-in fade-in slide-in-from-bottom-2 duration-500 animation-delay-100"
      >
        {/* Board header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />
          <div className="px-5 py-3.5 border-b dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">Agenda de Serviços</span>
              {totalCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                  {totalCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {filterType === "TODAY" ? "Hoje" : filterType === "WEEK" ? "Esta Semana" : filterType === "MONTH" ? "Este Mês" : "Dia Específico"}
            </span>
          </div>
        </div>

        {/* Empty state */}
        {groupedAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 p-5 mb-4 ring-1 ring-blue-100 dark:ring-blue-900/50">
              <CalendarDays className="w-10 h-10 text-blue-300 dark:text-blue-700" />
            </div>
            <h3 className="font-bold text-zinc-700 dark:text-zinc-200 text-lg mb-1">Agenda livre neste período</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed">
              Nenhum agendamento encontrado. Aproveite para marcar novos serviços!
            </p>
            <button
              onClick={() => { setFormDate(customDate || formatLocal(new Date())); setOpenNewModal(true); }}
              className="mt-5 flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Novo Agendamento
            </button>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {groupedAppointments.map((group, gIdx) => (
              <div key={group.dateStr}>

                {/* ── Day header ── */}
                <div className={`px-5 py-2.5 flex items-center gap-2.5 sticky top-0 z-10 backdrop-blur-sm ${
                  group.isToday
                    ? "bg-blue-50/90 dark:bg-blue-950/40 border-y border-blue-100 dark:border-blue-900/40"
                    : "bg-zinc-50/90 dark:bg-zinc-900/80 border-y border-zinc-100 dark:border-zinc-800"
                }`}>
                  {group.isToday && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                  )}
                  <span className={`text-xs font-black uppercase tracking-wider ${
                    group.isToday ? "text-blue-700 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"
                  }`}>
                    {group.dateFormatted}
                  </span>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    group.isToday
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                  }`}>
                    {group.appointments.length} {group.appointments.length === 1 ? "serviço" : "serviços"}
                  </span>
                </div>

                {/* ── Appointment cards ── */}
                <div className="p-3 space-y-2.5">
                  {group.appointments.map((app, idx) => {
                    const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG["SCHEDULED"];
                    const globalIdx = gIdx * 5 + idx;
                    return (
                      <div
                        key={app.id}
                        className={`group/card relative flex flex-col sm:flex-row gap-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-zinc-900/60 transition-all duration-200 hover:-translate-y-px border-l-4 ${cfg.color} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        style={{ animationDelay: `${globalIdx * 50}ms` }}
                      >
                        {/* Time column — desktop only sidebar */}
                        <div className="hidden sm:flex sm:flex-col items-center justify-center gap-2 px-4 py-4 sm:w-[96px] shrink-0 bg-zinc-50 dark:bg-zinc-800/40 border-r border-zinc-100 dark:border-zinc-700/50">
                          <div className="text-center">
                            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
                              {app.time}
                            </p>
                            {app.endTime && (
                              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1 leading-none">
                                até {app.endTime}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={app.status} />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col gap-2.5">

                          {/* Mobile: time + status row */}
                          <div className="flex sm:hidden items-center gap-2.5">
                            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
                              {app.time}
                            </span>
                            {app.endTime && (
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">até {app.endTime}</span>
                            )}
                            <div className="ml-auto">
                              <StatusBadge status={app.status} />
                            </div>
                          </div>

                          {/* Row 1: Customer + Vehicle */}
                          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-sm font-black text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                {app.customer.name}
                              </p>
                              {app.customer.phone && (
                                <p className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  {app.customer.phone}
                                </p>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 leading-tight truncate">
                                <Car className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                {app.vehicle
                                  ? `${app.vehicle.brand} ${app.vehicle.model}`
                                  : <span className="text-zinc-400 font-normal italic">Veículo não informado</span>}
                              </p>
                              {app.vehicle?.plate && (
                                <span className="inline-block mt-0.5 font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                                  {app.vehicle.plate}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Notes */}
                          {app.notes && (
                            <div className="flex items-start gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                              <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                                {app.notes}
                              </p>
                            </div>
                          )}

                          {/* Row 3: OS linked or actions */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {app.order ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-lg px-2.5 py-1.5">
                                  <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                                    OS #{app.order.number}
                                  </span>
                                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold">
                                    {OS_STATUS_LABEL[app.order.status] ?? app.order.status}
                                  </span>
                                </div>
                                <Link href={`/dashboard/os?q=${app.order.number}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs gap-1.5 rounded-lg text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Abrir OS
                                  </Button>
                                </Link>
                              </div>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleWhatsAppReminder(app)}
                                  className="h-8 px-2.5 text-xs text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 border border-transparent hover:border-green-200 dark:hover:border-green-900/50 gap-1.5 rounded-lg"
                                  title="Lembrete WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </Button>

                                {app.status === "SCHEDULED" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatus(app.id, "CONFIRMED")}
                                    className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-900/50 dark:text-emerald-400 gap-1.5 rounded-lg"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Confirmar
                                  </Button>
                                )}

                                {(app.status === "SCHEDULED" || app.status === "CONFIRMED") && (
                                  <button
                                    onClick={() => handleGenerateOS(app.id)}
                                    disabled={isGeneratingOS === app.id}
                                    className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
                                  >
                                    {isGeneratingOS === app.id ? (
                                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                                    ) : (
                                      <>Gerar OS <ArrowRight className="w-3.5 h-3.5" /></>
                                    )}
                                  </button>
                                )}

                                <div className="flex items-center gap-1.5 ml-auto">
                                  <Select onValueChange={(val) => handleStatus(app.id, val)} value={app.status}>
                                    <SelectTrigger size="sm" className="w-[130px]">
                                      <SelectValue>{STATUS_CONFIG[app.status]?.label ?? app.status}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="SCHEDULED" label="Marcado">
                                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" /> Marcado
                                      </SelectItem>
                                      <SelectItem value="CONFIRMED" label="Confirmado">
                                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" /> Confirmado
                                      </SelectItem>
                                      <SelectItem value="NO_SHOW" label="Faltou">
                                        <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" /> Faltou
                                      </SelectItem>
                                      <SelectItem value="CANCELED" label="Cancelado">
                                        <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" /> Cancelado
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                      if (confirm("Excluir agendamento?")) {
                                        await deleteAppointment(app.id);
                                        toast.success("Excluído!");
                                      }
                                    }}
                                    className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── NEW APPOINTMENT MODAL ─────────────────────────────────────────── */}
      <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
        <DialogContent size="md">
          <DialogHeader
            icon={<CalendarDays className="w-5 h-5 text-white" />}
            iconClass="bg-gradient-to-br from-violet-500 to-violet-700 shadow-violet-600/30"
            title="Agendar Serviço"
            description="Preencha os dados para marcar o serviço"
          />

          <DialogBody>
            <div className="space-y-4">

              {/* Conflict warning */}
              {conflictingAppointment && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-yellow-900 dark:text-yellow-400">Choque de Horário</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-500/80 mt-0.5 leading-relaxed">
                      <b>{conflictingAppointment.customer?.name}</b> já agendado para as <b>{formTime}</b>.
                    </p>
                  </div>
                </div>
              )}

              {/* ── DATA ── */}
              <div>
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Data e Horário</p>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Data</label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="h-10 w-full text-sm dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark] rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Início *</label>
                      <Input
                        type="time"
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="h-10 w-full text-sm dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark] rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        Término <span className="font-normal text-zinc-400">opcional</span>
                      </label>
                      <Input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="h-10 w-full text-sm dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark] rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CLIENTE E VEÍCULO ── */}
              <div>
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Cliente e Veículo</p>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Cliente *</label>
                    <Select onValueChange={setSelectedCustomer} value={selectedCustomer}>
                      <SelectTrigger className="w-full h-10 rounded-xl">
                        {selectedCustomer
                          ? <span className="flex-1 min-w-0 text-left truncate text-sm">{customers.find(c => c.id === selectedCustomer)?.name}</span>
                          : <span className="flex-1 text-left text-sm text-zinc-400 dark:text-zinc-500">Selecione o cliente...</span>}
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Veículo</label>
                    <Select
                      onValueChange={setSelectedVehicle}
                      value={selectedVehicle}
                      disabled={!selectedCustomer || customerVehicles.length === 0}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl">
                        {selectedVehicle
                          ? (() => {
                              const v = customerVehicles.find((cv: any) => cv.id === selectedVehicle);
                              return v
                                ? <span className="flex-1 min-w-0 text-left truncate text-sm">{v.plate} — {v.brand} {v.model}</span>
                                : null;
                            })()
                          : <span className="flex-1 text-left text-sm text-zinc-400 dark:text-zinc-500">
                              {!selectedCustomer ? "Selecione um cliente" : customerVehicles.length > 0 ? "Selecione o veículo..." : "Sem veículo"}
                            </span>}
                      </SelectTrigger>
                      <SelectContent>
                        {customerVehicles.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>
                            <span className="font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400">{v.plate}</span>
                            <span className="text-zinc-600 dark:text-zinc-300">{v.brand} {v.model}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── OS VINCULADA ── */}
              <div>
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                  Vínculo com OS <span className="normal-case font-normal text-zinc-300 dark:text-zinc-600">— Opcional</span>
                </p>
                <Select onValueChange={handleSelectOrder} value={selectedOrder} disabled={!selectedCustomer}>
                  <SelectTrigger className="w-full h-10 rounded-xl">
                    {selectedOrder
                      ? (() => {
                          const o = availableOrders.find(or => or.id === selectedOrder);
                          return o
                            ? <span className="flex-1 min-w-0 text-left truncate text-sm">
                                OS #{o.number} — {o.vehicle ? `${o.vehicle.plate} · ${o.vehicle.brand} ${o.vehicle.model}` : o.customer.name}
                              </span>
                            : null;
                        })()
                      : <span className="flex-1 text-left text-sm text-zinc-400 dark:text-zinc-500">
                          {!selectedCustomer ? "Selecione um cliente" : availableOrders.length === 0 ? "Sem OS disponível" : "Sem vínculo"}
                        </span>}
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        <span className="font-black text-blue-600 dark:text-blue-400">#{o.number}</span>
                        <span className="truncate text-zinc-500 dark:text-zinc-400">
                          {o.vehicle ? `${o.vehicle.plate} · ${o.vehicle.brand} ${o.vehicle.model}` : o.customer.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedOrder && (
                  <p className="flex items-center gap-1 mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    Agendamento criado como &quot;OS Gerada&quot; com a OS vinculada.
                  </p>
                )}
              </div>

              {/* ── NOTAS ── */}
              <div>
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Motivo / Reclamação</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Barulho no motor, revisão dos 50k, troca de óleo..."
                  className="w-full min-h-[80px] resize-none text-sm dark:bg-zinc-900 dark:border-zinc-800 rounded-xl"
                />
              </div>

            </div>
          </DialogBody>

          <DialogFooter>
            {/* Cancelar — auto width */}
            <button
              onClick={() => setOpenNewModal(false)}
              className="h-11 px-4 shrink-0 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-[0.97]"
            >
              Cancelar
            </button>
            {/* Salvar — takes remaining width */}
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="h-11 flex-1 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md shadow-blue-600/30 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar Agendamento"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
