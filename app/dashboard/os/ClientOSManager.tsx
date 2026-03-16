// app/dashboard/os/ClientOSManager.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { Search, Plus, Trash2, FileText, Printer, MessageCircle, Settings, Car, Gauge, ShieldCheck, AlignLeft, HardHat, Wrench, Eye, Edit3, X, Save, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createOrder, updateOrderStatus, updateOrderDetails } from "@/actions/os";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";

export function ClientOSManager({ initialOrders, customers, products, tenant, employees }: { initialOrders: any[], customers: any[], products: any[], tenant: any, employees: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openNewOS, setOpenNewOS] = useState(false);
  const [openViewOS, setOpenViewOS] = useState(false); 
  const [isEditing, setIsEditing] = useState(false); 
  const [selectedOS, setSelectedOS] = useState<any | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef, 
    content: () => printRef.current, 
    documentTitle: `OS_${selectedOS?.number || '000'}`,
  } as any);

  const filteredOrders = initialOrders.filter(o => 
    o.number.toString().includes(searchTerm) ||
    o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
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
        if (field === "productId" && value) {
          const prod = products.find(p => p.id === value);
          if (prod) { updated.name = prod.name; updated.unitPrice = prod.sellingPrice; }
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
    setSelectedCustomerId(""); setSelectedVehicleId(""); setItems([]); setMechanics([]); setDiscount(0); 
    setProblem(""); setNotes(""); setMileage(""); setDeliveryDate(""); setCustomerNotes("");
    setWarrantyText("A garantia dos serviços e peças obedece ao código de defesa do consumidor, válida mediante apresentação deste documento original.");
  };

  const handleOpenNewOS = () => {
    resetForm();
    setSelectedOS(null);
    setIsEditing(true);
    setOpenNewOS(true);
  };

  const openOSDetails = (os: any) => {
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
    
    setItems(os.items.map((i: any) => ({ ...i })));
    setMechanics(os.mechanics.map((m: any) => ({ id: m.id, employeeId: m.employeeId, task: m.task })));
    
    setIsEditing(false); 
    setOpenViewOS(true);
  };

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
      const data = {
        customerId: selectedCustomer, vehicleId: selectedVehicle, mileage, fuelLevel,
        deliveryDate, problem, notes, customerNotes, warrantyText,
        laborTotal, partsTotal, discount, total: grandTotal, items, mechanics
      };
      await createOrder(data);
      toast.success("OS gerada com sucesso!");
      setOpenNewOS(false);
      resetForm();
    } catch { toast.error("Erro ao gerar OS."); }
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
      const data = {
        customerId: selectedCustomer, vehicleId: selectedVehicle, mileage, fuelLevel,
        deliveryDate, problem, notes, customerNotes, warrantyText,
        laborTotal, partsTotal, discount, total: grandTotal, items, mechanics
      };
      await updateOrderDetails(selectedOS.id, data);
      toast.success("OS atualizada com sucesso!");
      setIsEditing(false);
      setOpenViewOS(false);
      resetForm();
    } catch { toast.error("Erro ao atualizar a OS no banco."); }
  };

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

  const triggerPDFPrint = (e: any, os: any) => {
    if (e) e.stopPropagation(); 
    setSelectedOS(os);
    setTimeout(() => { if (handlePrint) handlePrint(); }, 300); 
  };

  const handleWhatsApp = (e: any, os: any) => {
    if (e) e.stopPropagation();
    if (!os.customer.phone) { toast.error("Cliente sem telefone."); return; }
    const msg = `Olá ${os.customer.name}, tudo bem? Aqui é da ${tenant?.name || 'Oficina'}.\nSegue o resumo para o seu ${os.vehicle.brand} ${os.vehicle.model} (${os.vehicle.plate}):\n\nTotal: *${formatBRL(os.total)}*\n\nQualquer dúvida, estamos à disposição!`;
    const url = `https://wa.me/55${os.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCompleteOS = async (e: any, os: any) => {
    if (e) e.stopPropagation();
    if(!confirm(`Deseja finalizar a OS #${os.number} e lançar ${formatBRL(os.total)} no caixa financeiro?`)) return;
    try {
      await updateOrderStatus(os.id, "COMPLETED", "Dinheiro/Pix"); 
      toast.success("OS Finalizada e lançada no Caixa!");
      setOpenViewOS(false);
    } catch { toast.error("Erro ao finalizar OS."); }
  };

  const handleApproveOS = async (e: any, os: any) => {
    if (e) e.stopPropagation();
    if(!confirm(`Deseja aprovar o orçamento da OS #${os.number}? O status mudará para "Aprovado".`)) return;
    try {
      await updateOrderStatus(os.id, "APPROVED"); 
      toast.success("Orçamento aprovado!");
      if (openViewOS) setOpenViewOS(false);
    } catch {
      toast.error("Erro ao aprovar orçamento.");
    }
  };

  // =========================================================================
  // NOVA FUNÇÃO: ALTERAÇÃO DINÂMICA DE STATUS VIA DROPDOWN
  // =========================================================================
  const handleStatusChange = async (e: any, os: any, newStatus: string) => {
    if (e) e.stopPropagation();
    if (os.status === newStatus) return; // Ignora se for o mesmo status

    // Se estiver mudando para COMPLETED, usa a função que avisa sobre o Caixa Financeiro
    if (newStatus === "COMPLETED") {
      return handleCompleteOS(e, os);
    }

    try {
      await updateOrderStatus(os.id, newStatus as any);
      toast.success("Status atualizado com sucesso!");
      // Atualiza o estado local para a UI refletir a mudança instantaneamente sem fechar o modal
      setSelectedOS({ ...os, status: newStatus });
    } catch {
      toast.error("Erro ao atualizar o status da OS.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TELA INVISÍVEL DO PDF */}
      <div style={{ display: "none" }}>
        <div ref={printRef} className="print-wrapper">
          {selectedOS && (
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
                    <span className="text-xs font-bold text-zinc-500 uppercase">Subtotal Peças</span>
                    <span className="text-xs font-medium">{formatBRL(selectedOS.partsTotal)}</span>
                  </div>
                  <div className="flex justify-between px-3 py-1.5 border-b border-zinc-200 bg-zinc-50">
                    <span className="text-xs font-bold text-zinc-500 uppercase">Subtotal M.O.</span>
                    <span className="text-xs font-medium">{formatBRL(selectedOS.laborTotal)}</span>
                  </div>
                  {selectedOS.discount > 0 && (
                    <div className="flex justify-between px-3 py-1.5 border-b border-zinc-200 bg-red-50 text-red-600">
                      <span className="text-xs font-bold uppercase">Desconto</span>
                      <span className="text-xs font-bold">- {formatBRL(selectedOS.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-3 bg-zinc-900 text-white">
                    <span className="text-sm font-black uppercase tracking-wider">Total a Pagar</span>
                    <span className="text-lg font-black">{formatBRL(selectedOS.total)}</span>
                  </div>
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
          )}
        </div>
      </div>

      {/* CABEÇALHO E BUSCA DA PÁGINA */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar OS, placa ou cliente..." className="pl-9 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenNewOS}>
          <Plus className="mr-2 h-4 w-4" /> Novo Orçamento
        </Button>
      </div>

      {/* MODAL ÚNICO E INTELIGENTE: CRIAÇÃO / VISUALIZAÇÃO / EDIÇÃO */}
      <Dialog open={openNewOS || openViewOS} onOpenChange={(open) => {
        if (!open) { setOpenNewOS(false); setOpenViewOS(false); setIsEditing(false); }
      }}>
        <DialogContent className="sm:max-w-[1200px] !max-w-[1200px] w-[95vw] max-h-[95vh] flex flex-col p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl">
          
          <div className="px-6 py-4 md:px-8 md:py-5 border-b dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 shrink-0 z-10 shadow-sm">
            <div>
              <DialogTitle className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {openNewOS ? (
                  <><Wrench className="w-5 h-5 text-blue-600"/> Abertura de Orçamento</>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>OS #{selectedOS?.number}</span>
                    {/* DROPDOWN MENU PARA MUDANÇA RÁPIDA DE STATUS */}
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
                          <DropdownMenuItem className="cursor-pointer" onClick={(e) => handleStatusChange(e, selectedOS, "COMPLETED")}>
                            <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Finalizada</div>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={(e) => handleStatusChange(e, selectedOS, "CANCELED")}>
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
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              
              {openNewOS && (
                <>
                  <Button variant="outline" onClick={() => setOpenNewOS(false)} className="dark:border-zinc-700">Cancelar</Button>
                  <Button onClick={handleSaveOS} className="bg-blue-600 hover:bg-blue-700 text-white">Salvar e Gerar OS</Button>
                </>
              )}

              {openViewOS && !isEditing && (
                <>
                  <Button variant="outline" onClick={(e) => triggerPDFPrint(e, selectedOS)}><Printer className="w-4 h-4 mr-2" /> Imprimir</Button>

                  {selectedOS?.status !== "COMPLETED" && (
                    <Button variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20" onClick={() => setIsEditing(true)}>
                      <Edit3 className="w-4 h-4 mr-2" /> Editar OS
                    </Button>
                  )}
                  {selectedOS?.status !== "COMPLETED" && (
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={(e) => handleCompleteOS(e, selectedOS)}>
                      <ShieldCheck className="w-4 h-4 mr-2" /> Finalizar no Caixa
                    </Button>
                  )}
                </>
              )}

              {openViewOS && isEditing && (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="text-red-500"><X className="w-4 h-4 mr-2"/> Cancelar Edição</Button>
                  <Button onClick={handleUpdateOS} className="bg-blue-600 hover:bg-blue-700 text-white"><Save className="w-4 h-4 mr-2"/> Salvar Alterações</Button>
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
                      <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
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
                      <SelectContent>{customerVehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}</SelectContent>
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
                      <SelectContent>
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
                        <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
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

            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 gap-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Lançamento de Itens</h3>
                {(isEditing || openNewOS) && (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddItem(true)} className="text-orange-700 border-orange-200 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400">
                      <Settings className="w-4 h-4 mr-2"/> + Serviço
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddItem(false)} className="text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400">
                      <FileText className="w-4 h-4 mr-2"/> + Peça
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-4 md:p-6 space-y-4">
                {items.length === 0 && <div className="py-8 text-center border-2 border-dashed dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950"><p className="text-sm text-zinc-500">Nenhum item adicionado.</p></div>}
                {items.map((item) => (
                  <div key={item.id} className={`flex flex-col md:flex-row gap-4 md:items-end p-4 rounded-xl border dark:border-zinc-800 shadow-sm ${item.isLabor ? 'bg-orange-50/10 dark:bg-orange-950/5' : 'bg-blue-50/10 dark:bg-blue-950/5'}`}>
                    <div className="w-full md:flex-1 space-y-1.5">
                      <label className={`text-[10px] uppercase font-black tracking-wider ${item.isLabor ? 'text-orange-600' : 'text-blue-600'}`}>{item.isLabor ? 'Descrição do Serviço' : 'Peça do Estoque'}</label>
                      {!item.isLabor ? (
                        <Select onValueChange={(val) => updateItem(item.id, "productId", val)} value={item.productId} disabled={!isEditing && !openNewOS}>
                          <SelectTrigger className={`h-10 ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`}>
                            <SelectValue placeholder="Buscar peça...">
                              {item.productId ? products.find(p => p.id === item.productId)?.name : "Buscar peça..."}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - {formatBRL(p.sellingPrice)}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <Input className={`h-10 ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`} value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} readOnly={!isEditing && !openNewOS} />
                      )}
                    </div>
                    <div className="flex gap-3 w-full md:w-auto items-end">
                      <div className="w-20 space-y-1.5 shrink-0"><label className="text-[10px] uppercase font-bold text-zinc-500">Qtd</label><Input className={`h-10 text-center font-bold ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-white'}`} type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} readOnly={!isEditing && !openNewOS} /></div>
                      <div className="flex-1 md:w-32 space-y-1.5"><label className="text-[10px] uppercase font-bold text-zinc-500">Unitário</label><Input className={`h-10 ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-white'}`} type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} readOnly={!isEditing && !openNewOS} /></div>
                      <div className="flex-1 md:w-36 space-y-1.5"><label className="text-[10px] uppercase font-bold text-zinc-500">Total</label><div className={`h-10 flex items-center px-3 border dark:border-zinc-800 rounded-md font-bold text-sm ${!isEditing && !openNewOS ? 'bg-transparent border-dashed' : 'bg-zinc-100 dark:bg-zinc-900'}`}>{formatBRL(item.total)}</div></div>
                      {(isEditing || openNewOS) && <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setItems(items.filter(i => i.id !== item.id))}><Trash2 className="w-4 h-4"/></Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-4 md:px-8 md:py-5 bg-zinc-900 dark:bg-zinc-950 border-t dark:border-zinc-800 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center z-20 gap-4 overflow-x-auto">
            <div className="flex items-center gap-4 md:gap-8 text-sm text-zinc-400 w-full sm:w-auto">
              <div><p className="text-[10px] font-bold uppercase mb-1">Peças</p><p className="text-lg md:text-xl text-white font-bold">{formatBRL(partsTotal)}</p></div>
              <div className="border-l border-zinc-700 pl-4 md:pl-8"><p className="text-[10px] font-bold uppercase mb-1">Serviços</p><p className="text-lg md:text-xl text-white font-bold">{formatBRL(laborTotal)}</p></div>
              <div className="border-l border-zinc-700 pl-4 md:pl-8">
                <p className="text-[10px] font-bold uppercase mb-1 text-emerald-400">Desconto (R$)</p>
                <Input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className={`w-24 md:w-28 h-8 ${!isEditing && !openNewOS ? 'bg-transparent' : 'bg-white/10'} border-0 text-white font-bold text-base md:text-lg px-2`} readOnly={!isEditing && !openNewOS} />
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto border-t border-zinc-700 sm:border-0 pt-3 sm:pt-0">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total a Pagar</p>
              <p className="text-3xl md:text-4xl font-black text-emerald-400">{formatBRL(grandTotal)}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* TABELA PRINCIPAL DA TELA */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
            <TableRow className="dark:border-zinc-800">
              <TableHead className="dark:text-zinc-400">Número & Status</TableHead>
              <TableHead className="dark:text-zinc-400">Cliente / Veículo</TableHead>
              <TableHead className="dark:text-zinc-400">Problema Relatado</TableHead>
              <TableHead className="text-right dark:text-zinc-400">Total</TableHead>
              <TableHead className="text-right dark:text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-zinc-500">Nenhum orçamento encontrado.</TableCell></TableRow>
            )}
            {filteredOrders.map(os => (
              <TableRow key={os.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:border-zinc-800 cursor-pointer" onClick={() => openOSDetails(os)}>
                <TableCell>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base">OS #{os.number}</p>
                  <div className="mt-1">{getStatusBadge(os.status)}</div>
                </TableCell>
                <TableCell>
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">{os.customer.name}</p>
                  <p className="text-xs font-mono text-zinc-500 mt-1">{os.vehicle.plate} - {os.vehicle.brand}</p>
                </TableCell>
                <TableCell className="max-w-[250px] truncate text-sm text-zinc-600 dark:text-zinc-400">{os.problem || "Não informado"}</TableCell>
                <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100">{formatBRL(os.total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400" title="Ver Detalhes"><Eye className="w-4 h-4"/></Button>
                    
                    {os.status !== "COMPLETED" && (
                      <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50 dark:text-emerald-500" onClick={(e) => handleCompleteOS(e, os)} title="Finalizar e Lançar no Caixa">
                        <ShieldCheck className="w-4 h-4"/>
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50 dark:text-green-500" onClick={(e) => handleWhatsApp(e, os)} title="Enviar WhatsApp"><MessageCircle className="w-4 h-4"/> </Button>
                    
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50 dark:text-blue-500" onClick={(e) => triggerPDFPrint(e, os)} title="Imprimir PDF"><Printer className="w-4 h-4"/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}