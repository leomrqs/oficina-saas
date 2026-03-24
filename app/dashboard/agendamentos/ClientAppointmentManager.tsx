// app/dashboard/agendamentos/ClientAppointmentManager.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { CalendarDays, Plus, Clock, Car, User, FileText, CheckCircle2, Trash2, ArrowRight, Phone, Calendar as CalendarIcon, Filter, MessageCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAppointment, updateAppointmentStatus, deleteAppointment, generateOSFromAppointment } from "@/actions/appointments";
import { toast } from "sonner";

const getStatusBadge = (status: string) => {
  switch(status) {
    case "SCHEDULED": return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">Marcado</Badge>;
    case "CONFIRMED": return <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">Confirmado</Badge>;
    case "COMPLETED": return <Badge variant="outline" className="text-zinc-500 bg-zinc-100 border-zinc-200 dark:bg-zinc-500/10 dark:border-zinc-500/20 dark:text-zinc-400">OS Gerada</Badge>;
    case "NO_SHOW": return <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400">Faltou</Badge>;
    case "CANCELED": return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">Cancelado</Badge>;
    default: return <Badge>{status}</Badge>;
  }
};

export function ClientAppointmentManager({ appointments, customers }: { appointments: any[], customers: any[] }) {
  
  // Formatador de data local seguro contra fuso horário
  const formatLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
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

  // Estados de Filtro
  const [filterType, setFilterType] = useState<"TODAY" | "WEEK" | "MONTH" | "CUSTOM">("WEEK");
  const [customDate, setCustomDate] = useState<string>(formatLocal(new Date()));
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [openNewModal, setOpenNewModal] = useState(false);

  // Form State
  const [formDate, setFormDate] = useState(formatLocal(new Date()));
  const [formTime, setFormTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState(""); // NOVO: Estado de Tempo Estimado
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [notes, setNotes] = useState("");

  const customerVehicles = useMemo(() => customers.find(c => c.id === selectedCustomer)?.vehicles || [], [selectedCustomer, customers]);

  // NOVO: Alerta de Choque de Horário (Real-time Overbooking Detection)
  const conflictingAppointment = useMemo(() => {
    if (!formDate || !formTime) return null;
    return appointments.find(app => {
      const appDateStr = new Date(app.date).toISOString().split('T')[0];
      return appDateStr === formDate && app.time === formTime && app.status !== "CANCELED" && app.status !== "NO_SHOW";
    });
  }, [formDate, formTime, appointments]);

  // Atualiza o Range de Datas baseado no filtro escolhido
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
    } else if (filterType === "CUSTOM") {
      setDateRange({ start: customDate, end: customDate });
    }
  }, [filterType, customDate]);

  // Filtra e Agrupa os agendamentos por Dia
  const groupedAppointments = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];

    // 1. Filtra pelo range
    const filtered = appointments.filter(app => {
      const appDateStr = new Date(app.date).toISOString().split('T')[0];
      return appDateStr >= dateRange.start && appDateStr <= dateRange.end;
    });

    // 2. Agrupa por data
    const groups: Record<string, any[]> = {};
    filtered.forEach(app => {
      const dateStr = new Date(app.date).toISOString().split('T')[0];
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(app);
    });

    // 3. Ordena os dias e os horários dentro de cada dia
    const sortedKeys = Object.keys(groups).sort();
    return sortedKeys.map(key => {
      const dateObj = new Date(`${key}T12:00:00Z`);
      const isToday = key === formatLocal(new Date());
      
      // Formata: "Segunda-feira, 24 de Março"
      let dateFormatted = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' });
      // Capitaliza a primeira letra
      dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

      return {
        dateStr: key,
        dateFormatted: isToday ? `Hoje (${dateFormatted})` : dateFormatted,
        isToday,
        appointments: groups[key].sort((a, b) => a.time.localeCompare(b.time))
      };
    });
  }, [appointments, dateRange]);

  const handleCreate = async () => {
    if (!selectedCustomer || !formDate || !formTime) return toast.error("Preencha cliente, data e hora inicial.");
    try {
      await createAppointment({ customerId: selectedCustomer, vehicleId: selectedVehicle, date: formDate, time: formTime, endTime: formEndTime, notes });
      toast.success("Agendamento criado!");
      setOpenNewModal(false);
      setSelectedCustomer(""); setSelectedVehicle(""); setNotes(""); setFormEndTime("");
    } catch { toast.error("Erro ao agendar."); }
  };

  const handleStatus = async (id: string, status: any) => {
    try { await updateAppointmentStatus(id, status); toast.success("Status atualizado."); } 
    catch { toast.error("Erro ao atualizar."); }
  };

  const handleGenerateOS = async (id: string) => {
    if (!confirm("Deseja gerar uma OS de Orçamento para este agendamento? Ele será marcado como 'OS Gerada'.")) return;
    try {
      await generateOSFromAppointment(id);
      toast.success("OS Gerada com sucesso! Vá para a tela de Pátio ou Orçamentos para adicionar peças.");
    } catch { toast.error("Erro ao gerar OS. O agendamento tem veículo atrelado?"); }
  };

  // NOVO: Função do WhatsApp
  const handleWhatsAppReminder = (app: any) => {
    if (!app.customer.phone) return toast.error("Cliente sem telefone cadastrado.");
    const dateObj = new Date(`${app.date.split('T')[0]}T12:00:00Z`);
    const dateFormatted = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
    const vehicleStr = app.vehicle ? `${app.vehicle.brand} ${app.vehicle.model}` : "veículo";
    const timeStr = app.endTime ? `${app.time} às ${app.endTime}` : app.time;
    
    const msg = `Olá *${app.customer.name}*, tudo bem?\nPassando para lembrar e confirmar seu agendamento conosco.\n\n📅 *Data:* ${dateFormatted}\n⏰ *Horário:* ${timeStr}\n🚗 *Veículo:* ${vehicleStr}\n\nPodemos confirmar sua presença?`;
    window.open(`https://wa.me/55${app.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* BARRA DE FILTROS E CONTROLES */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm gap-4">
        
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Button variant={filterType === "TODAY" ? "default" : "ghost"} size="sm" onClick={() => setFilterType("TODAY")} className={filterType === "TODAY" ? "bg-blue-600 hover:bg-blue-700" : "text-zinc-600 dark:text-zinc-400"}>
            Hoje
          </Button>
          <Button variant={filterType === "WEEK" ? "default" : "ghost"} size="sm" onClick={() => setFilterType("WEEK")} className={filterType === "WEEK" ? "bg-blue-600 hover:bg-blue-700" : "text-zinc-600 dark:text-zinc-400"}>
            Esta Semana
          </Button>
          <Button variant={filterType === "MONTH" ? "default" : "ghost"} size="sm" onClick={() => setFilterType("MONTH")} className={filterType === "MONTH" ? "bg-blue-600 hover:bg-blue-700" : "text-zinc-600 dark:text-zinc-400"}>
            Este Mês
          </Button>
          
          <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-3 ml-1">
            <CalendarIcon className="w-4 h-4 text-zinc-400 hidden sm:block" />
            <Input 
              type="date" 
              value={customDate} 
              onChange={(e) => { setCustomDate(e.target.value); setFilterType("CUSTOM"); }} 
              className="h-8 text-xs bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark] w-[130px]"
            />
          </div>
        </div>

        <Button className="w-full lg:w-auto h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold" onClick={() => { setFormDate(customDate || formatLocal(new Date())); setOpenNewModal(true); }}>
          <Plus className="w-4 h-4 mr-2"/> Novo Agendamento
        </Button>
      </div>

      {/* PLANILHA VISUAL AGRUPADA POR DIA */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border dark:border-zinc-800 shadow-sm overflow-hidden">
        
        <div className="p-4 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500"/> Agenda de Serviços
          </h3>
          <span className="text-xs font-bold text-zinc-500 uppercase">
            {filterType === "TODAY" ? "Visualizando Hoje" : filterType === "WEEK" ? "Visualizando a Semana" : filterType === "MONTH" ? "Visualizando o Mês" : "Visualizando Dia Específico"}
          </span>
        </div>
        
        <div className="flex flex-col">
          {groupedAppointments.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-zinc-400">
              <CalendarDays className="w-16 h-16 mb-4 opacity-30"/>
              <p className="font-medium text-lg text-zinc-500">A agenda está livre para este período.</p>
              <p className="text-sm mt-1">Clique em "Novo Agendamento" para adicionar um serviço.</p>
            </div>
          ) : (
            groupedAppointments.map(group => (
              <div key={group.dateStr} className="flex flex-col border-b dark:border-zinc-800 last:border-0">
                
                {/* CABEÇALHO DO DIA */}
                <div className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-y dark:border-zinc-800 flex items-center gap-2 ${group.isToday ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/50' : 'bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-500'}`}>
                  {group.isToday && <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>}
                  {group.dateFormatted}
                </div>

                {/* LISTA DE AGENDAMENTOS DO DIA */}
                <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {group.appointments.map(app => (
                    <div key={app.id} className="flex flex-col lg:flex-row gap-4 p-4 lg:items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group/row">
                      
                      {/* Hora e Status (NOVO: Com horário final) */}
                      <div className="flex items-center gap-4 lg:w-48 shrink-0">
                        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-lg overflow-hidden flex flex-col text-center min-w-[80px]">
                          <div className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white font-black text-lg py-1 px-3">
                            {app.time}
                          </div>
                          {app.endTime && (
                            <div className="bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 font-bold uppercase py-0.5 border-t border-zinc-200 dark:border-zinc-700">
                              Até {app.endTime}
                            </div>
                          )}
                        </div>
                        <div>{getStatusBadge(app.status)}</div>
                      </div>

                      {/* Info Cliente/Carro */}
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base truncate flex items-center gap-1.5">
                            <User className="w-4 h-4 text-zinc-400"/> {app.customer.name}
                          </p>
                          {app.customer.phone && (
                            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                              <Phone className="w-3 h-3"/> {app.customer.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-700 dark:text-zinc-300 text-sm truncate flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-zinc-400"/> 
                            {app.vehicle ? `${app.vehicle.brand} ${app.vehicle.model}` : 'Veículo não informado'}
                          </p>
                          <p className="text-xs font-mono text-zinc-500 mt-1">
                            {app.vehicle?.plate || '---'}
                          </p>
                        </div>
                      </div>

                      {/* Motivo */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText className="w-3 h-3"/> Motivo / Serviço</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate" title={app.notes}>{app.notes || 'Sem observações'}</p>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0 w-full lg:w-auto pt-3 lg:pt-0 mt-2 lg:mt-0">
                        
                        {/* Se já virou OS */}
                        {app.order ? (
                          <Badge variant="outline" className="h-9 px-3 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-sm flex gap-2">
                            OS #{app.order.number} <span className="font-normal opacity-70">({app.order.status})</span>
                          </Badge>
                        ) : (
                          <>
                            {/* Botões de Ação Rápida */}
                            
                            {/* NOVO: Botão WhatsApp */}
                            <Button variant="ghost" size="icon" onClick={() => handleWhatsAppReminder(app)} className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors" title="Lembrete WhatsApp">
                              <MessageCircle className="w-4 h-4"/>
                            </Button>

                            {app.status === "SCHEDULED" && (
                              <Button variant="outline" size="sm" onClick={() => handleStatus(app.id, "CONFIRMED")} className="text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-900/50">
                                <CheckCircle2 className="w-4 h-4 mr-1"/> Confirmar
                              </Button>
                            )}
                            
                            {(app.status === "SCHEDULED" || app.status === "CONFIRMED") && (
                              <Button size="sm" onClick={() => handleGenerateOS(app.id)} className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm">
                                Gerar OS <ArrowRight className="w-4 h-4 ml-1"/>
                              </Button>
                            )}

                            <Select onValueChange={(val) => handleStatus(app.id, val)} value={app.status}>
                              <SelectTrigger className="w-[130px] h-9 text-xs font-bold dark:bg-zinc-900 dark:border-zinc-800">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                                <SelectItem value="SCHEDULED">Marcado</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                                <SelectItem value="NO_SHOW">Faltou</SelectItem>
                                <SelectItem value="CANCELED">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button variant="ghost" size="icon" onClick={async () => { if(confirm("Excluir agendamento?")) { await deleteAppointment(app.id); toast.success("Excluído!"); } }} className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 lg:opacity-0 lg:group-hover/row:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL DE NOVO AGENDAMENTO */}
      <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
        <DialogContent className="sm:max-w-lg dark:bg-zinc-950 dark:border-zinc-800 p-0 overflow-hidden rounded-xl">
          <div className="p-6 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <DialogTitle className="flex items-center gap-2 text-xl"><CalendarDays className="w-5 h-5 text-blue-500"/> Agendar Serviço</DialogTitle>
          </div>
          <div className="space-y-5 p-6">

            {/* NOVO: Alerta de Choque de Horário */}
            {conflictingAppointment && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-yellow-900 dark:text-yellow-400 text-sm">Alerta de Choque de Horário</p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-500/80 mt-1">Você já possui o cliente <b>{conflictingAppointment.customer?.name}</b> marcado exatamente para as <b>{formTime}</b>. Tem certeza que deseja encaixar?</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Data</label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="h-12 text-base font-bold dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Início (Hora)</label>
                <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="h-12 text-base font-bold dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between">Término <span className="text-[9px] text-zinc-400">(Opcional)</span></label>
                <Input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} className="h-12 text-base font-bold dark:bg-zinc-900 dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">Cliente *</label>
              <Select onValueChange={setSelectedCustomer} value={selectedCustomer}>
                <SelectTrigger className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800"><SelectValue placeholder="Selecione o cliente..."/></SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">Veículo do Cliente</label>
              <Select onValueChange={setSelectedVehicle} value={selectedVehicle} disabled={!selectedCustomer || customerVehicles.length === 0}>
                <SelectTrigger className="h-12 text-base dark:bg-zinc-900 dark:border-zinc-800">
                  <SelectValue placeholder={customerVehicles.length > 0 ? "Selecione o veículo..." : "Cliente sem veículo"} />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                  {customerVehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">Motivo / Reclamação / Sintoma</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Barulho no motor, Revisão dos 50k, Troca de óleo..." className="min-h-[100px] resize-none text-base dark:bg-zinc-900 dark:border-zinc-800" />
            </div>
          </div>
          <DialogFooter className="p-4 border-t dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
            <Button variant="outline" onClick={() => setOpenNewModal(false)} className="h-11 dark:border-zinc-800 w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleCreate} className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base w-full sm:w-auto">Salvar Agendamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}