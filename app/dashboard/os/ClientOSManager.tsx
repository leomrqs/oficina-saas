// app/dashboard/os/ClientOSManager.tsx
"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Trash2, FileText, Printer, MessageCircle, Settings, Car, Gauge, ShieldCheck, AlignLeft, HardHat, Wrench, Eye, Edit3, X, Save, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Filter, ArrowUp, ArrowDown, CalendarClock, CreditCard, Smartphone, Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createOrder, updateOrderStatus, updateOrderDetails, deleteOrder } from "@/actions/os";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";

const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';

const getStatusBadge = (status: string) => {
  switch(status) {
    case "PENDING": return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-500">Orçamento</Badge>;
    case "APPROVED": return <Badge variant="outline" className="text-sky-600 border-sky-200 bg-sky-50 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400">Aprovado</Badge>;
    case "WAITING_PARTS": return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">Aguardando Peça</Badge>;
    case "IN_PROGRESS": return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400">No Elevador</Badge>;
    case "READY": return <Badge variant="outline" className="text-teal-600 border-teal-200 bg-teal-50 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-400">Pronto / Retirada</Badge>;
    case "COMPLETED": return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">Finalizada</Badge>;
    case "CANCELED": return <Badge variant="outline" className="text-zinc-600 border-zinc-200 bg-zinc-50 dark:bg-zinc-500/10 dark:border-zinc-500/20 dark:text-zinc-400">Cancelada</Badge>;
    default: return <Badge>{status}</Badge>;
  }
};

export function ClientOSManager({ initialOrders, customers, products, tenant, employees }: { initialOrders: any[], customers: any[], products: any[], tenant: any, employees: any[] }) {
  // Filtros e Paginação
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [openNewOS, setOpenNewOS] = useState(false);
  const [openViewOS, setOpenViewOS] = useState(false); 
  const [isEditing, setIsEditing] = useState(false); 
  const [selectedOS, setSelectedOS] = useState<any | null>(null);

  // Estados para Finalização e Pagamento
  const [completingOS, setCompletingOS] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef, 
    content: () => printRef.current, 
    documentTitle: `OS_${selectedOS?.number || '000'}`,
  } as any);

  // Filtra Catálogos
  const physicalProducts = useMemo(() => products.filter(p => !p.isService), [products]);
  const serviceProducts = useMemo(() => products.filter(p => p.isService), [products]);

  // Reseta para a página 1 sempre que os filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortOrder]);

  // Aplica Filtros e Ordenação
  const filteredAndSortedOrders = useMemo(() => {
    let result = initialOrders.filter(o => {
      const matchSearch = 
        o.number.toString().includes(searchTerm) ||
        o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      
      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime(); // Ordenando pela data de criação
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [initialOrders, searchTerm, statusFilter, sortOrder]);

  // Aplica Paginação
  const totalPages = Math.ceil(filteredAndSortedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const [selectedCustomer, setSelectedCustomerId] = useState("");
  const [selectedVehicle, setSelectedVehicleId] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState("1/2");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [problem, setProblem] = useState("");
  const [notes, setNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [warrantyText, setWarrantyText] = useState("A garantia dos serviços e peças obedece ao código de defesa do consumidor, válida mediante apresentação deste documento original.");
  const [discount, setDiscount] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);

  const customerVehicles = useMemo(() => {
    return customers.find(c => c.id === selectedCustomer)?.vehicles || [];
  }, [selectedCustomer, customers]);

  const partsTotal = items.filter(i => !i.isLabor).reduce((acc, curr) => acc + curr.total, 0);
  const laborTotal = items.filter(i => i.isLabor).reduce((acc, curr) => acc + curr.total, 0);
  const grandTotal = partsTotal + laborTotal - discount;

  const handleAddItem = (isLabor: boolean) => setItems([...items, { id: Math.random().toString(), isLabor, name: "", productId: "", quantity: 1, unitPrice: 0, total: 0 }]);
  
  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "productId") {
          if (value === "MANUAL") {
             updated.productId = ""; updated.name = ""; updated.unitPrice = 0;
          } else {
             const prod = products.find(p => p.id === value);
             if (prod) { updated.name = prod.name; updated.unitPrice = prod.sellingPrice; }
          }
        }
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    }));
  };

  const handleAddMechanic = () => setMechanics([...mechanics, { id: Math.random().toString(), employeeId: "", task: "" }]);
  const updateMechanic = (id: string, field: string, value: any) => setMechanics(mechanics.map(m => m.id === id ? { ...m, [field]: value } : m));

  const resetForm = () => {
    setSelectedCustomerId(""); setSelectedVehicleId(""); setItems([]); setMechanics([]); setDiscount(0); setAdvancePayment(0);
    setProblem(""); setNotes(""); setMileage(""); setDeliveryDate(""); setCustomerNotes("");
    setWarrantyText("A garantia dos serviços e peças obedece ao código de defesa do consumidor, válida mediante apresentação deste documento original.");
  };

  const handleOpenNewOS = () => {
    resetForm();
    setSelectedOS(null);
    setIsEditing(true);
    setOpenNewOS(true);
  };

  const openOSDetails = useCallback((os: any) => {
    setSelectedOS(os);
    setSelectedCustomerId(os.customerId);
    setSelectedVehicleId(os.vehicleId);
    setMileage(os.mileage || "");
    setFuelLevel(os.fuelLevel || "1/2");
    setDeliveryDate(os.deliveryDate ? new Date(os.deliveryDate).toISOString().split('T')[0] : "");
    setProblem(os.problem || "");
    setCustomerNotes(os.customerNotes || "");
    setWarrantyText(os.warrantyText || "");
    setDiscount(os.discount || 0);
    setAdvancePayment(os.advancePayment || 0); 
    
    setItems(os.items.map((i: any) => ({ ...i })));
    setMechanics(os.mechanics.map((m: any) => ({ id: m.id, employeeId: m.employeeId, task: m.task })));
    
    setIsEditing(false); 
    setOpenViewOS(true);
  }, []);

  const handleSaveOS = async () => {
    if (!selectedCustomer || !selectedVehicle || items.length === 0) {
      toast.error("Selecione cliente, veículo e adicione pelo menos 1 item.");
      return;
    }
    if (mechanics.some(m => !m.employeeId)) {
      toast.error("Preencha qual mecânico realizou a tarefa, ou remova a linha vazia.");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = {
        customerId: selectedCustomer, vehicleId: selectedVehicle, mileage, fuelLevel,
        deliveryDate, problem, notes, customerNotes, warrantyText,
        laborTotal, partsTotal, discount, advancePayment, total: grandTotal, items, mechanics
      };
      await createOrder(data);
      toast.success("OS gerada com sucesso!");
      setOpenNewOS(false);
      resetForm();
    } catch { toast.error("Erro ao gerar OS."); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateOS = async () => {
    if (!selectedCustomer || !selectedVehicle || items.length === 0) {
      toast.error("Selecione cliente, veículo e adicione pelo menos 1 item.");
      return;
    }
    if (mechanics.some(m => !m.employeeId)) {
      toast.error("Preencha qual mecânico realizou a tarefa, ou remova a linha vazia.");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = {
        customerId: selectedCustomer, vehicleId: selectedVehicle, mileage, fuelLevel,
        deliveryDate, problem, notes, customerNotes, warrantyText,
        laborTotal, partsTotal, discount, advancePayment, total: grandTotal, items, mechanics
      };
      await updateOrderDetails(selectedOS.id, data);
      toast.success("OS atualizada com sucesso!");
      setIsEditing(false);
      setOpenViewOS(false);
      resetForm();
    } catch { toast.error("Erro ao atualizar a OS no banco."); }
    finally { setIsSubmitting(false); }
  };

  const triggerPDFPrint = useCallback((e: any, os: any) => {
    if (e) e.stopPropagation(); 
    setSelectedOS(os);
    setTimeout(() => { if (handlePrint) handlePrint(); }, 300); 
  }, [handlePrint]);

  const handleWhatsApp = useCallback((e: any, os: any) => {
    if (e) e.stopPropagation();
    if (!os.customer.phone) { toast.error("Cliente sem telefone."); return; }
    
    const remaining = Math.max(0, os.total - (os.advancePayment || 0));
    let financeMsg = `\nTotal do Serviço: *${formatBRL(os.total)}*`;
    
    if (os.status !== "COMPLETED" && os.advancePayment > 0) {
      financeMsg += `\nSinal Pago: *${formatBRL(os.advancePayment)}*`;
      financeMsg += `\nFalta Pagar: *${formatBRL(remaining)}*`;
    } else if (os.status === "COMPLETED") {
      financeMsg = `\nValor Total Pago: *${formatBRL(os.total)}* (Serviço Finalizado)`;
    }

    const msg = `Olá *${os.customer.name}*, tudo bem? Aqui é da ${tenant?.name || 'Oficina'}.\nSegue o resumo da sua OS #${os.number} para o ${os.vehicle.brand} ${os.vehicle.model}:\n${financeMsg}\n\nQualquer dúvida, estamos à disposição!`;
    const url = `https://wa.me/55${os.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }, [tenant?.name]);

  const handleCompleteClick = useCallback((e: React.MouseEvent | null, os: Record<string, unknown>) => {
    if (e) e.stopPropagation();
    setCompletingOS(os);
  }, []);

  const confirmCompleteOS = async () => {
    try {
      setIsSubmitting(true);
      await updateOrderStatus(completingOS.id, "COMPLETED", paymentMethod);
      toast.success("OS Finalizada e Lançada no Caixa!");
      setCompletingOS(null);
      setOpenViewOS(false);
    } catch { toast.error("Erro ao finalizar OS."); }
    finally { setIsSubmitting(false); }
  };

  const handleStatusChange = useCallback(async (e: any, os: any, newStatus: string) => {
    if (e) e.stopPropagation();
    if (os.status === newStatus) return; 

    if (newStatus === "COMPLETED") {
      return handleCompleteClick(e, os);
    }

    if (newStatus === "APPROVED" && os.status === "PENDING") {
      if(!confirm(`Deseja aprovar o orçamento da OS #${os.number}? Isso criará as projeções "A Receber" no seu painel financeiro.`)) return;
    }

    try {
      await updateOrderStatus(os.id, newStatus as any);
      toast.success("Status atualizado com sucesso!");
      setSelectedOS({ ...os, status: newStatus });
    } catch {
      toast.error("Erro ao atualizar o status da OS.");
    }
  }, []);

  const handleDeleteOS = useCallback(async (e: any, os: any) => {
    if (e) e.stopPropagation();
    if (!confirm(`⚠️ ALERTA: Tem certeza que deseja EXCLUIR a OS #${os.number}?\n\nEsta ação é irreversível e apagará todo o histórico da ordem.`)) return;

    try {
      await deleteOrder(os.id);
      toast.success("OS excluída com sucesso!");
      if (openViewOS) setOpenViewOS(false);
    } catch {
      toast.error("Erro ao excluir a OS.");
    }
  }, [openViewOS]);


  const memoizedPDF = useMemo(() => {
    if (!selectedOS) return null;
    const remaining = Math.max(0, selectedOS.total - (selectedOS.advancePayment || 0));

    return (
      <div className="print-container bg-white text-black p-[10mm] w-[210mm] min-h-[297mm] mx-auto text-sm font-sans" style={{ color: 'black' }}>
        <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-4 mb-6">
          <div className="flex items-center gap-4">
            {tenant?.logoUrl && <img src={tenant.logoUrl} alt="Logo" className="w-20 h-20 object-contain" />}
            <div>
              <h1 className="text-2xl font-black uppercase text-zinc-900">{tenant?.name || "OFICINA SAAS"}</h1>
              {tenant?.cnpj && <p className="text-xs font-bold text-zinc-600">CNPJ: {tenant.cnpj}</p>}
              <p className="text-xs text-zinc-600 mt-1 max-w-[250px]">{tenant?.address || "Endereço não cadastrado"}</p>
              <p className="text-xs text-zinc-600 mt-0.5">WhatsApp: {tenant?.phone || "Não informado"}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-zinc-300">OS #{selectedOS.number}</p>
            <p className="text-sm font-bold text-zinc-600 mt-1">Data: {new Date(selectedOS.createdAt).toLocaleDateString('pt-BR')}</p>
            <div className="mt-2 inline-block px-3 py-1 bg-zinc-100 border border-zinc-300 font-bold uppercase text-xs rounded-sm">
              {selectedOS.status === 'PENDING' ? 'ORÇAMENTO' : selectedOS.status === 'COMPLETED' ? 'RECIBO / FINALIZADO' : 'ORDEM DE SERVIÇO'}
            </div>
          </div>
        </div>

        <div className="flex border border-zinc-300 rounded-md overflow-hidden mb-6">
          <div className="w-1/2 p-3 bg-zinc-50 border-r border-zinc-300">
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Dados do Cliente</p>
            <p className="font-bold text-base text-zinc-900">{selectedOS.customer.name}</p>
            <p className="text-xs mt-1">Doc: <span className="font-medium">{selectedOS.customer.document || "N/I"}</span></p>
            <p className="text-xs mt-0.5">Fone: <span className="font-medium">{selectedOS.customer.phone || "N/I"}</span></p>
          </div>
          <div className="w-1/2 p-3">
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Veículo e Vistoria</p>
            <p className="font-bold text-base text-zinc-900">{selectedOS.vehicle.brand} {selectedOS.vehicle.model} <span className="font-normal text-zinc-500">| {selectedOS.vehicle.year || ''}</span></p>
            <div className="grid grid-cols-2 mt-1 gap-y-1">
              <p className="text-xs">Placa: <span className="font-mono font-bold">{selectedOS.vehicle.plate}</span></p>
              <p className="text-xs">KM: <span className="font-medium">{selectedOS.mileage || "N/I"}</span></p>
              <p className="text-xs">Combustível: <span className="font-medium">{selectedOS.fuelLevel || "N/I"}</span></p>
              {selectedOS.deliveryDate && <p className="text-xs text-red-600">Entrega: <span className="font-bold">{formatDate(selectedOS.deliveryDate)}</span></p>}
            </div>
          </div>
        </div>

        {selectedOS.mechanics && selectedOS.mechanics.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 border-b border-zinc-300 pb-1">Mecânicos e Técnicos Designados</p>
            <div className="flex flex-wrap gap-2">
              {selectedOS.mechanics.map((mech: any) => (
                <span key={mech.id} className="text-xs bg-zinc-100 border border-zinc-200 px-2 py-1 rounded-md">
                  <strong>{mech.employee.name}</strong> ({mech.task})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 border-b border-zinc-300 pb-1">Peças e Serviços Autorizados</p>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-y border-zinc-300">
                <th className="py-2 px-2 font-bold w-12">Tipo</th>
                <th className="py-2 px-2 font-bold">Descrição</th>
                <th className="py-2 px-2 font-bold text-center w-16">Qtd</th>
                <th className="py-2 px-2 font-bold text-right w-24">V. Unit</th>
                <th className="py-2 px-2 font-bold text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedOS.items.map((item: any, i: number) => (
                <tr key={item.id} className={`border-b border-zinc-200 ${i % 2 === 0 ? '' : 'bg-zinc-50/50'}`}>
                  <td className="py-2 px-2 font-medium text-zinc-500">{item.isLabor ? 'SRV' : 'PÇ'}</td>
                  <td className="py-2 px-2 font-bold text-zinc-800">{item.name}</td>
                  <td className="py-2 px-2 text-center">{item.quantity}</td>
                  <td className="py-2 px-2 text-right">{formatBRL(item.unitPrice)}</td>
                  <td className="py-2 px-2 text-right font-bold">{formatBRL(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-72 border border-zinc-300 rounded-md overflow-hidden">
            <div className="flex justify-between px-3 py-1.5 border-b border-zinc-200 bg-zinc-50">
              <span className="text-xs font-bold text-zinc-500 uppercase">Subtotal</span>
              <span className="text-xs font-medium">{formatBRL(selectedOS.partsTotal + selectedOS.laborTotal)}</span>
            </div>
            {selectedOS.discount > 0 && (
              <div className="flex justify-between px-3 py-1.5 border-b border-zinc-200 bg-red-50 text-red-600">
                <span className="text-xs font-bold uppercase">Desconto</span>
                <span className="text-xs font-bold">- {formatBRL(selectedOS.discount)}</span>
              </div>
            )}
            
            <div className="flex justify-between px-4 py-2 bg-zinc-200 text-zinc-900 border-b border-zinc-300">
              <span className="text-sm font-black uppercase tracking-wider">Total</span>
              <span className="text-sm font-black">{formatBRL(selectedOS.total)}</span>
            </div>

            {selectedOS.status === "COMPLETED" ? (
              <div className="flex justify-between px-4 py-3 bg-emerald-600 text-white">
                <span className="text-sm font-black uppercase tracking-wider">TOTAL PAGO</span>
                <span className="text-lg font-black">{formatBRL(selectedOS.total)}</span>
              </div>
            ) : (
              <>
                {selectedOS.advancePayment > 0 && (
                  <div className="flex justify-between px-3 py-1.5 border-b border-zinc-200 bg-yellow-50 text-yellow-700">
                    <span className="text-xs font-bold uppercase">Sinal Pago</span>
                    <span className="text-xs font-bold">- {formatBRL(selectedOS.advancePayment)}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-zinc-900 text-white">
                  <span className="text-sm font-black uppercase tracking-wider">Falta Pagar</span>
                  <span className="text-lg font-black">{formatBRL(remaining)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-12">
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-1 border-b border-zinc-300 pb-1">Observações P/ O Cliente</p>
            <p className="text-xs text-zinc-700 italic min-h-[40px] whitespace-pre-wrap">{selectedOS.customerNotes || "Nenhuma observação extra."}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-1 border-b border-zinc-300 pb-1">Termos de Garantia</p>
            <p className="text-[10px] text-zinc-700 font-medium whitespace-pre-wrap leading-tight">{selectedOS.warrantyText}</p>
          </div>
        </div>

        <div className="flex justify-between mt-auto pt-16 px-8">
          <div className="text-center w-64 border-t border-zinc-400 pt-2">
            <p className="text-xs font-bold text-zinc-900">{tenant?.name || "Responsável Oficina"}</p>
          </div>
          <div className="text-center w-64 border-t border-zinc-400 pt-2">
            <p className="text-xs font-bold text-zinc-900">Assinatura do Cliente</p>
            <p className="text-[10px] text-zinc-500">Declaro estar de acordo com as condições.</p>
          </div>
        </div>
      </div>
    );
  }, [selectedOS, tenant]);


  const memoizedTable = useMemo(() => (
    <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
          <TableRow className="dark:border-zinc-800">
            <TableHead className="dark:text-zinc-400">OS & Data</TableHead>
            <TableHead className="dark:text-zinc-400">Cliente / Veículo</TableHead>
            <TableHead className="dark:text-zinc-400 hidden md:table-cell">Problema Relatado</TableHead>
            <TableHead className="text-right dark:text-zinc-400">Total / Saldo</TableHead>
            <TableHead className="text-right dark:text-zinc-400">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedOrders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-0">
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-5 mb-4 ring-1 ring-zinc-200 dark:ring-zinc-700">
                    <Wrench className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <h3 className="font-bold text-zinc-700 dark:text-zinc-200 text-lg mb-1">
                    Nenhuma OS encontrada
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                    Tente ajustar os filtros ou crie um novo orçamento para começar.
                  </p>
                  <Button
                    className="mt-5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    onClick={() => setOpenNewOS(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Novo Orçamento
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
          {paginatedOrders.map(os => {
            const isCompleted = os.status === "COMPLETED";
            const hasAdvance = os.advancePayment > 0;
            const remaining = Math.max(0, os.total - (os.advancePayment || 0));
            
            return (
            <TableRow key={os.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:border-zinc-800 cursor-pointer" onClick={() => openOSDetails(os)}>
              <TableCell>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base">#{os.number}</p>
                  <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <CalendarClock className="w-3 h-3"/> {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div>{getStatusBadge(os.status)}</div>
              </TableCell>
              <TableCell>
                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[150px] md:max-w-[200px]">{os.customer.name}</p>
                <p className="text-xs font-mono text-zinc-500 mt-1">{os.vehicle.plate} - {os.vehicle.brand}</p>
              </TableCell>
              <TableCell className="max-w-[250px] truncate text-sm text-zinc-600 dark:text-zinc-400 hidden md:table-cell">{os.problem || "Não informado"}</TableCell>
              
              <TableCell className="text-right">
                {isCompleted ? (
                  <>
                    <p className="font-black text-zinc-400 dark:text-zinc-600 text-lg line-through">{formatBRL(os.total)}</p>
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 mt-1 uppercase text-[9px] tracking-widest border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
                    </Badge>
                  </>
                ) : (
                  <>
                    <p className="font-black text-emerald-600 dark:text-emerald-400 text-xl">{formatBRL(remaining)}</p>
                    {hasAdvance && (
                      <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-500 dark:border-yellow-900/50 mt-1 font-bold text-[10px]">
                        Sinal Pago: {formatBRL(os.advancePayment)}
                      </Badge>
                    )}
                  </>
                )}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800" title="Ver Detalhes"><Eye className="w-4 h-4"/></Button>
                  
                  {!isCompleted && (
                    <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-950/30" onClick={(e) => handleCompleteClick(e, os)} title="Finalizar e Lançar no Caixa">
                      <ShieldCheck className="w-4 h-4"/>
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-950/30 hidden sm:inline-flex" onClick={(e) => handleWhatsApp(e, os)} title="Enviar WhatsApp"><MessageCircle className="w-4 h-4"/> </Button>
                  <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-blue-950/30 hidden sm:inline-flex" onClick={(e) => triggerPDFPrint(e, os)} title="Imprimir PDF"><Printer className="w-4 h-4"/></Button>
                  <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-950/30" onClick={(e) => handleDeleteOS(e, os)} title="Excluir OS">
                    <Trash2 className="w-4 h-4"/>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
      </div>

      {/* CONTROLES DE PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t dark:border-zinc-800 gap-4 bg-zinc-50/50 dark:bg-zinc-950/50">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Mostrando {paginatedOrders.length} de {filteredAndSortedOrders.length} registros
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <span className="text-sm font-medium px-2 dark:text-zinc-300">
              Página {currentPage} de {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
              className="dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              Próxima <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  ), [paginatedOrders, filteredAndSortedOrders.length, currentPage, totalPages, openOSDetails, handleCompleteClick, handleWhatsApp, triggerPDFPrint, handleDeleteOS]);

  return (
    <div className="space-y-6">
      
      <div style={{ display: "none" }}>
        <div ref={printRef} className="print-wrapper">
          {memoizedPDF}
        </div>
      </div>

      {/* ÁREA SUPERIOR: BUSCA, FILTROS E BOTÃO NOVO */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input 
              placeholder="Buscar OS, placa ou cliente..." 
              className="pl-9 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm w-full" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="flex gap-2 w-full xl:w-auto">
            {/* Filtro de Status com Bolinhas Coloridas */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 sm:w-[220px] bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm font-medium">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-zinc-400" />
                  <SelectValue placeholder="Status da OS" />
                </div>
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                <SelectItem value="ALL" className="font-bold">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600"></div> Todos os Status</div>
                </SelectItem>
                <SelectItem value="PENDING">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Orçamentos</div>
                </SelectItem>
                <SelectItem value="APPROVED">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-500"></div> Aprovados</div>
                </SelectItem>
                <SelectItem value="WAITING_PARTS">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Aguardando Peça</div>
                </SelectItem>
                <SelectItem value="IN_PROGRESS">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> No Elevador</div>
                </SelectItem>
                <SelectItem value="READY">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500"></div> Pronto / Retirada</div>
                </SelectItem>
                <SelectItem value="COMPLETED">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Finalizadas</div>
                </SelectItem>
                <SelectItem value="CANCELED">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-zinc-500"></div> Canceladas</div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenação por Data com Setas */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="flex-1 sm:w-[170px] bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm font-medium">
                <SelectValue placeholder="Ordem" />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                <SelectItem value="desc">
                  <div className="flex items-center gap-2"><ArrowDown className="w-4 h-4 text-zinc-400"/> Mais Recentes</div>
                </SelectItem>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2"><ArrowUp className="w-4 h-4 text-zinc-400"/> Mais Antigas</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white w-full xl:w-auto" onClick={handleOpenNewOS}>
          <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
        </Button>
      </div>

      <Dialog open={openNewOS || openViewOS} onOpenChange={(open) => {
        if (!open) { setOpenNewOS(false); setOpenViewOS(false); setIsEditing(false); }
      }}>
        <DialogContent className="sm:max-w-[1200px] !max-w-[1200px] w-[95vw] max-h-[95vh] flex flex-col p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl">
          
          <div className="px-6 py-4 md:px-8 md:py-5 border-b dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 shrink-0 z-10 shadow-sm">
            
            <div className="flex justify-between items-start w-full sm:w-auto">
              <div>
                <DialogTitle className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  {openNewOS ? (
                    <><Wrench className="w-5 h-5 text-blue-600"/> Abertura de Orçamento</>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>OS #{selectedOS?.number}</span>
                      {openViewOS && !isEditing ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="focus:outline-none flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer">
                            {getStatusBadge(selectedOS?.status)}
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="dark:bg-zinc-900 dark:border-zinc-800 p-2">
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => handleStatusChange(e, selectedOS, "PENDING")}>
                              <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Orçamento</div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => handleStatusChange(e, selectedOS, "APPROVED")}>
                              <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300"><div className="w-2 h-2 rounded-full bg-sky-500"></div> Aprovado</div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => handleStatusChange(e, selectedOS, "WAITING_PARTS")}>
                              <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300"><div className="w-2 h-2 rounded-full bg-red-500"></div> Aguardando Peça</div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => handleStatusChange(e, selectedOS, "IN_PROGRESS")}>
                              <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300"><div className="w-2 h-2 rounded-full bg-purple-500"></div> No Elevador</div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => handleStatusChange(e, selectedOS, "READY")}>
                              <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300"><div className="w-2 h-2 rounded-full bg-teal-500"></div> Pronto / Retirada</div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={(e) => handleCompleteClick(e, selectedOS)}>
                              <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Finalizar e Receber</div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer border-t dark:border-zinc-800 mt-2 pt-2" onClick={(e) => handleStatusChange(e, selectedOS, "CANCELED")}>
                              <div className="flex items-center gap-2 font-medium"><div className="w-2 h-2 rounded-full bg-zinc-500"></div> Cancelada</div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-sm font-normal">{getStatusBadge(selectedOS?.status)}</span>
                      )}
                    </div>
                  )}
                </DialogTitle>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {openNewOS ? "Preencha o checklist, atrele mecânicos e lance as peças." : (isEditing ? "Modo de Edição ativado. Faça suas alterações." : "Visualizando detalhes do Orçamento / Serviço.")}
                </p>
              </div>

              <Button variant="ghost" size="icon" className="sm:hidden text-zinc-500 -mr-2 -mt-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => { setOpenNewOS(false); setOpenViewOS(false); setIsEditing(false); }}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {openNewOS && (
                <>
                  <Button variant="outline" onClick={() => setOpenNewOS(false)} className="dark:border-zinc-700">Cancelar</Button>
                  <Button onClick={handleSaveOS} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : "Salvar e Gerar OS"}
                  </Button>
                </>
              )}

              {openViewOS && !isEditing && (
                <>
                  <Button variant="outline" onClick={(e) => triggerPDFPrint(e, selectedOS)}><Printer className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Imprimir</span></Button>

                  {selectedOS?.status !== "COMPLETED" && (
                    <Button variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20" onClick={() => setIsEditing(true)}>
                      <Edit3 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Editar OS</span>
                    </Button>
                  )}
                  {selectedOS?.status !== "COMPLETED" && (
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={(e) => handleCompleteClick(e, selectedOS)}>
                      <ShieldCheck className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Finalizar</span>
                    </Button>
                  )}

                  <Button variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/20" onClick={(e) => handleDeleteOS(e, selectedOS)}>
                    <Trash2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Excluir</span>
                  </Button>
                </>
              )}

              {openViewOS && isEditing && (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="text-red-500 dark:border-zinc-700"><X className="w-4 h-4 mr-2"/> Cancelar Edição</Button>
                  <Button onClick={handleUpdateOS} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2"/> Salvar Alterações</>}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 border dark:border-zinc-800 rounded-xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b dark:border-zinc-800 pb-2 flex items-center gap-2"><Car className="w-4 h-4 text-zinc-400" /> Vínculo</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cliente Solicitante *</label>
                    <Select onValueChange={setSelectedCustomerId} value={selectedCustomer} disabled={!isEditing && !openNewOS}>
                      <SelectTrigger className={`h-10 ${!isEditing && !openNewOS ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`}>
                        <SelectValue placeholder="Selecione o dono...">
                          {selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : "Selecione o dono..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Veículo do Cliente *</label>
                    <Select onValueChange={setSelectedVehicleId} value={selectedVehicle} disabled={(!isEditing && !openNewOS) || !selectedCustomer || customerVehicles.length === 0}>
                      <SelectTrigger className={`h-10 ${!isEditing && !openNewOS ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`}>
                        <SelectValue placeholder={customerVehicles.length > 0 ? "Selecione a placa..." : "Nenhum carro atrelado"}>
                          {selectedVehicle ? customerVehicles.find(v => v.id === selectedVehicle)?.plate : "Selecione a placa..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">{customerVehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 border dark:border-zinc-800 rounded-xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b dark:border-zinc-800 pb-2 flex items-center gap-2"><Gauge className="w-4 h-4 text-zinc-400" /> Operacional e Vistoria</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Quilometragem</label>
                    <Input className={`h-10 ${!isEditing && !openNewOS ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`} value={mileage} onChange={e => setMileage(e.target.value)} placeholder="Ex: 85.000" readOnly={!isEditing && !openNewOS} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Combustível</label>
                    <Select onValueChange={setFuelLevel} value={fuelLevel} disabled={!isEditing && !openNewOS}>
                      <SelectTrigger className={`h-10 ${!isEditing && !openNewOS ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`}><SelectValue/></SelectTrigger>
                      <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                        <SelectItem value="Reserva">Reserva (Vazio)</SelectItem>
                        <SelectItem value="1/4">1/4 (Um Quarto)</SelectItem>
                        <SelectItem value="1/2">1/2 (Meio Tanque)</SelectItem>
                        <SelectItem value="3/4">3/4</SelectItem>
                        <SelectItem value="Cheio">Cheio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Previsão Entrega</label>
                    <Input type="date" className={`h-10 ${!isEditing && !openNewOS ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]`} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} readOnly={!isEditing && !openNewOS} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 border dark:border-zinc-800 rounded-xl shadow-sm space-y-4 col-span-1">
                <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2"><HardHat className="w-4 h-4 text-zinc-400" /> Equipe na OS</h3>
                  {(isEditing || openNewOS) && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleAddMechanic}>+ Adicionar</Button>}
                </div>
                {mechanics.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhum mecânico atrelado.</p>
                ) : (
                  mechanics.map((mech) => (
                    <div key={mech.id} className={`flex flex-col gap-2 p-3 ${!isEditing && !openNewOS ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-zinc-50 dark:bg-zinc-950'} border dark:border-zinc-800 rounded-md`}>
                      <Select onValueChange={(val) => updateMechanic(mech.id, "employeeId", val)} value={mech.employeeId} disabled={!isEditing && !openNewOS}>
                        <SelectTrigger className={`h-9 text-xs ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-900'} dark:border-zinc-700`}><SelectValue placeholder="Quem vai fazer?" /></SelectTrigger>
                        <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">{employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Input className={`h-9 text-xs flex-1 ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-900'} dark:border-zinc-700`} placeholder="Tarefa (Ex: Suspensão)" value={mech.task} onChange={e => updateMechanic(mech.id, "task", e.target.value)} readOnly={!isEditing && !openNewOS} />
                        {(isEditing || openNewOS) && <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 shrink-0" onClick={() => setMechanics(mechanics.filter(m => m.id !== mech.id))}><Trash2 className="w-4 h-4"/></Button>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 border dark:border-zinc-800 rounded-xl shadow-sm col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><AlignLeft className="w-3 h-3"/> Reclamação / Defeito</label>
                  <Textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="Motivo da visita..." className={`min-h-[80px] resize-none ${!isEditing && !openNewOS ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'dark:bg-zinc-950'} dark:border-zinc-800`} readOnly={!isEditing && !openNewOS} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><AlignLeft className="w-3 h-3 text-emerald-500"/> Obs Cliente (PDF)</label>
                  <Textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} placeholder="Vai aparecer no orçamento..." className={`min-h-[80px] resize-none ${!isEditing && !openNewOS ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'dark:bg-zinc-950'} dark:border-zinc-800`} readOnly={!isEditing && !openNewOS} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-500"/> Termo Garantia</label>
                  <Textarea value={warrantyText} onChange={e => setWarrantyText(e.target.value)} className={`min-h-[80px] resize-none text-xs ${!isEditing && !openNewOS ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'dark:bg-zinc-950'} dark:border-zinc-800`} readOnly={!isEditing && !openNewOS} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 gap-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Lançamento de Itens</h3>
                {(isEditing || openNewOS) && (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddItem(true)} className="text-orange-700 border-orange-200 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-900/30 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50">
                      <Settings className="w-4 h-4 mr-2"/> + Serviço
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddItem(false)} className="text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50">
                      <FileText className="w-4 h-4 mr-2"/> + Peça
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-4 md:p-6 space-y-4">
                {items.length === 0 && <div className="py-8 text-center border-2 border-dashed dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950"><p className="text-sm text-zinc-500">Nenhum item adicionado.</p></div>}
                {items.map((item) => (
                  <div key={item.id} className={`flex flex-col md:flex-row gap-4 md:items-end p-4 rounded-xl border dark:border-zinc-800 shadow-sm ${item.isLabor ? 'bg-orange-50/10 dark:bg-orange-950/5' : 'bg-blue-50/10 dark:bg-blue-950/5'}`}>
                    
                    <div className="w-full md:flex-1 space-y-1.5 flex flex-col sm:flex-row gap-2 sm:items-end">
                      <div className="flex-1 space-y-1.5">
                        <label className={`text-[10px] uppercase font-black tracking-wider ${item.isLabor ? 'text-orange-600' : 'text-blue-600'}`}>{item.isLabor ? 'Descrição do Serviço' : 'Peça do Estoque'}</label>
                        {!isEditing && !openNewOS ? (
                          <div className="h-10 flex items-center px-3 text-sm font-bold bg-transparent border-dashed border dark:border-zinc-700 rounded-md">
                            {item.name || "Item não identificado"}
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Select onValueChange={(val) => updateItem(item.id, "productId", val)} value={item.productId || "MANUAL"}>
                              <SelectTrigger className={`h-10 sm:w-[180px] shrink-0 bg-white dark:bg-zinc-950 dark:border-zinc-800`}>
                                <SelectValue placeholder="Catálogo..." />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                                <SelectItem value="MANUAL" className="font-bold text-blue-600">✏️ Digitar Avulso</SelectItem>
                                {(item.isLabor ? serviceProducts : physicalProducts).map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.name} - {formatBRL(p.sellingPrice)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input 
                              placeholder="Descrição do item..." 
                              value={item.name} 
                              onChange={e => updateItem(item.id, "name", e.target.value)} 
                              className="h-10 bg-white dark:bg-zinc-950 dark:border-zinc-800" 
                              readOnly={!!item.productId && item.productId !== "MANUAL"} 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto items-end">
                      <div className="w-20 space-y-1.5 shrink-0"><label className="text-[10px] uppercase font-bold text-zinc-500">Qtd</label><Input className={`h-10 text-center font-bold ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`} type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} readOnly={!isEditing && !openNewOS} /></div>
                      <div className="flex-1 md:w-32 space-y-1.5"><label className="text-[10px] uppercase font-bold text-zinc-500">Unitário</label><Input className={`h-10 ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`} type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} readOnly={!isEditing && !openNewOS} /></div>
                      <div className="flex-1 md:w-36 space-y-1.5"><label className="text-[10px] uppercase font-bold text-zinc-500">Total</label><div className={`h-10 flex items-center px-3 border dark:border-zinc-800 rounded-md font-bold text-sm ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-zinc-100 dark:bg-zinc-900'}`}>{formatBRL(item.total)}</div></div>
                      {(isEditing || openNewOS) && <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => setItems(items.filter(i => i.id !== item.id))}><Trash2 className="w-4 h-4"/></Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-4 md:px-8 md:py-5 bg-zinc-900 dark:bg-zinc-950 border-t dark:border-zinc-800 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center z-20 gap-4 overflow-x-auto">
            <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm text-zinc-400 w-full sm:w-auto">
              <div><p className="text-[10px] font-bold uppercase mb-1">Peças</p><p className="text-lg md:text-xl text-white font-bold">{formatBRL(partsTotal)}</p></div>
              <div className="border-l border-zinc-700 pl-4 md:pl-8"><p className="text-[10px] font-bold uppercase mb-1">Serviços</p><p className="text-lg md:text-xl text-white font-bold">{formatBRL(laborTotal)}</p></div>
              <div className="border-l border-zinc-700 pl-4 md:pl-8">
                <p className="text-[10px] font-bold uppercase mb-1 text-emerald-400">Desconto (R$)</p>
                <Input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className={`w-24 h-8 ${!isEditing && !openNewOS ? 'bg-transparent' : 'bg-white/10 dark:bg-zinc-800'} border-0 text-white font-bold text-base px-2`} readOnly={!isEditing && !openNewOS} />
              </div>

              <div className="border-l border-zinc-700 pl-4 md:pl-8 relative">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] font-bold uppercase text-yellow-400">Sinal / Adiant.</p>
                  {(isEditing || openNewOS) && (
                    <button type="button" onClick={() => setAdvancePayment((partsTotal + laborTotal - discount) / 2)} className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded hover:bg-yellow-500/40 transition-colors">
                      50%
                    </button>
                  )}
                </div>
                <Input type="number" value={advancePayment} onChange={e => setAdvancePayment(parseFloat(e.target.value) || 0)} className={`w-28 h-8 ${!isEditing && !openNewOS ? 'bg-transparent' : 'bg-white/10 dark:bg-zinc-800'} border-0 text-white font-bold text-base px-2`} readOnly={!isEditing && !openNewOS} />
              </div>

            </div>
            <div className="text-left sm:text-right w-full sm:w-auto border-t border-zinc-700 sm:border-0 pt-3 sm:pt-0">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Falta Pagar</p>
              <p className="text-3xl md:text-4xl font-black text-emerald-400">{formatBRL(Math.max(0, grandTotal - advancePayment))}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE PAGAMENTO PARA FINALIZAR A OS */}
      <Dialog open={!!completingOS} onOpenChange={(open) => !open && setCompletingOS(null)}>
        <DialogContent className="w-[90vw] max-w-md dark:bg-zinc-950 dark:border-zinc-800 rounded-xl p-0 overflow-hidden">
          <div className="p-6 border-b dark:border-zinc-800 bg-emerald-600 text-white">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="w-6 h-6" /> Finalizar e Receber OS
            </DialogTitle>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border dark:border-zinc-800 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Valor do Fechamento</p>
              <p className="text-4xl font-black text-zinc-900 dark:text-zinc-100">{formatBRL(Math.max(0, (completingOS?.total || 0) - (completingOS?.advancePayment || 0)))}</p>
              {completingOS?.advancePayment > 0 && <p className="text-[10px] text-yellow-600 uppercase font-bold mt-1">Já abati o sinal de {formatBRL(completingOS.advancePayment)}!</p>}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Meio de Pagamento do Saldo</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-14 text-lg font-bold dark:bg-zinc-900 dark:border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                  <SelectItem value="PIX"><div className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-emerald-500"/> PIX</div></SelectItem>
                  <SelectItem value="Cartão de Crédito"><div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-500"/> Cartão de Crédito</div></SelectItem>
                  <SelectItem value="Cartão de Débito"><div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-orange-500"/> Cartão de Débito</div></SelectItem>
                  <SelectItem value="Dinheiro"><div className="flex items-center gap-2"><Banknote className="w-5 h-5 text-green-600"/> Dinheiro / Espécie</div></SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">Isso vai lançar o valor como "Pago" no Caixa Financeiro e dar baixa definitiva nas peças do Estoque.</p>
            </div>
          </div>
          <DialogFooter className="p-4 border-t dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto h-12" onClick={() => setCompletingOS(null)}>Cancelar</Button>
            <Button onClick={confirmCompleteOS} disabled={isSubmitting} className="w-full sm:w-auto h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base">
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</> : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {memoizedTable}

    </div>
  );
}