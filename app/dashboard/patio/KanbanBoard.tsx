// app/dashboard/patio/KanbanBoard.tsx
"use client";

import { useState, useMemo, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { updateOrderStatus, updateOrderDetails } from "@/actions/os";
import { toast } from "sonner";
import { Car, Wrench, Package, CheckCircle2, User, FileText, HardHat, FileCheck, Search, Clock, Printer, Edit3, ShieldCheck, MessageCircle, ChevronDown, X, Save, Gauge, AlignLeft, Settings, Trash2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReactToPrint } from "react-to-print";

const COLUMNS = [
  { id: "PENDING", title: "Orçamentos", icon: FileText, color: "bg-zinc-100 border-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300" },
  { id: "APPROVED", title: "Aprovados", icon: FileCheck, color: "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-900 dark:text-sky-400" },
  { id: "WAITING_PARTS", title: "Aguardando Peça", icon: Package, color: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400" },
  { id: "IN_PROGRESS", title: "No Elevador", icon: Wrench, color: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900 dark:text-purple-400" },
  { id: "READY", title: "Pronto / Retirada", icon: CheckCircle2, color: "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/30 dark:border-teal-900 dark:text-teal-400" },
];

export function KanbanBoard({ initialOrders, customers, products, tenant, employees }: any) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  
  const [searchFilter, setSearchFilter] = useState("");
  const [mechanicFilter, setMechanicFilter] = useState("ALL");

  const [openViewOS, setOpenViewOS] = useState(false); 
  const [isEditing, setIsEditing] = useState(false); 
  const [selectedOS, setSelectedOS] = useState<any | null>(null);

  const [selectedCustomer, setSelectedCustomerId] = useState("");
  const [selectedVehicle, setSelectedVehicleId] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState("1/2");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [problem, setProblem] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [warrantyText, setWarrantyText] = useState("");
  const [discount, setDiscount] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0); // <-- NOVO ESTADO
  const [items, setItems] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);

  const customerVehicles = useMemo(() => customers.find((c: any) => c.id === selectedCustomer)?.vehicles || [], [selectedCustomer, customers]);
  const partsTotal = items.filter(i => !i.isLabor).reduce((acc, curr) => acc + curr.total, 0);
  const laborTotal = items.filter(i => i.isLabor).reduce((acc, curr) => acc + curr.total, 0);
  const grandTotal = partsTotal + laborTotal - discount;

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `OS_${selectedOS?.number || '000'}` } as any);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = o.vehicle.plate.toLowerCase().includes(searchFilter.toLowerCase()) || o.customer.name.toLowerCase().includes(searchFilter.toLowerCase());
      const matchMech = mechanicFilter === "ALL" || o.mechanics.some((m: any) => m.employeeId === mechanicFilter);
      return matchSearch && matchMech;
    });
  }, [orders, searchFilter, mechanicFilter]);

  const getTimeInStatus = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24));
    if (diff === 0) return "Hoje";
    if (diff === 1) return "Há 1 dia";
    return `Há ${diff} dias`;
  };

  const getStatusName = (status: string) => {
    const map: any = { PENDING: "Orçamento", APPROVED: "Aprovado", WAITING_PARTS: "Ag. Peça", IN_PROGRESS: "Em Serviço", READY: "Pronto", COMPLETED: "Finalizada", CANCELED: "Cancelada" };
    return map[status] || status;
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    if (type === "COLUMN") return;

    const newStatus = destination.droppableId;
    const updatedOrders = orders.map(o => o.id === draggableId ? { ...o, status: newStatus, updatedAt: new Date() } : o);
    setOrders(updatedOrders);

    try {
      await updateOrderStatus(draggableId, newStatus as any);
      toast.success("Status atualizado!");
    } catch {
      toast.error("Erro ao atualizar status.");
      setOrders(orders); 
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
    setAdvancePayment(os.advancePayment || 0); // <-- Adicionado Adiantamento
    setItems(os.items.map((i: any) => ({ ...i })));
    setMechanics(os.mechanics.map((m: any) => ({ id: m.id, employeeId: m.employeeId, task: m.task })));
    setIsEditing(false); 
    setOpenViewOS(true);
  };

  const handleUpdateOS = async () => {
    try {
      const data = {
        customerId: selectedCustomer, vehicleId: selectedVehicle, mileage, fuelLevel,
        deliveryDate, problem, customerNotes, warrantyText, laborTotal, partsTotal, discount, advancePayment, total: grandTotal, items, mechanics, status: selectedOS.status
      };
      await updateOrderDetails(selectedOS.id, data);
      
      const fullMechanics = mechanics.map(m => {
        const emp = employees.find((e: any) => e.id === m.employeeId);
        return { ...m, employee: emp || { name: 'Desconhecido' } };
      });
      const fullCustomer = customers.find((c: any) => c.id === selectedCustomer);
      const fullVehicle = customerVehicles.find((v: any) => v.id === selectedVehicle);

      const tempLog = { id: Math.random().toString(), newStatus: selectedOS.status, notes: "Detalhes atualizados manualmente.", createdAt: new Date() };

      setOrders(orders.map(o => o.id === selectedOS.id ? { 
        ...o, ...data, total: grandTotal, 
        mechanics: fullMechanics, 
        customer: fullCustomer || o.customer, 
        vehicle: fullVehicle || o.vehicle,
        history: [tempLog, ...(o.history || [])]
      } : o));
      
      toast.success("OS atualizada com sucesso!");
      setIsEditing(false);
      setOpenViewOS(false);
    } catch { toast.error("Erro ao atualizar a OS no banco."); }
  };

  const handleStatusChange = async (e: any, os: any, newStatus: string) => {
    if (e) e.stopPropagation();
    if (os.status === newStatus) return; 

    if (newStatus === "COMPLETED") {
      if(!confirm(`Deseja finalizar a OS #${os.number} e lançar no caixa?`)) return;
      try {
        await updateOrderStatus(os.id, "COMPLETED", "Dinheiro/Pix"); 
        toast.success("OS Finalizada e lançada no Caixa!");
        setOrders(orders.filter(o => o.id !== os.id)); 
        setOpenViewOS(false);
      } catch { toast.error("Erro ao finalizar OS."); }
      return;
    }

    try {
      await updateOrderStatus(os.id, newStatus as any);
      toast.success("Status atualizado!");
      
      const tempLog = { id: Math.random().toString(), oldStatus: os.status, newStatus: newStatus, notes: "Status alterado.", createdAt: new Date() };
      
      const updatedOrder = { ...os, status: newStatus, updatedAt: new Date(), history: [tempLog, ...(os.history || [])] };
      setOrders(orders.map(o => o.id === os.id ? updatedOrder : o));
      setSelectedOS(updatedOrder);
    } catch { toast.error("Erro ao atualizar o status da OS."); }
  };

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

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

  const handleAddItem = (isLabor: boolean) => setItems([...items, { id: Math.random().toString(), isLabor, name: "", productId: "", quantity: 1, unitPrice: 0, total: 0 }]);
  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "productId" && value) {
          const prod = products.find((p:any) => p.id === value);
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 shrink-0 bg-white dark:bg-zinc-900 p-3 rounded-lg border dark:border-zinc-800 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por placa, cliente..." className="pl-9 dark:bg-zinc-950 dark:border-zinc-800 h-9 text-sm" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
        </div>
        <div className="w-full sm:w-64">
          <Select value={mechanicFilter} onValueChange={setMechanicFilter}>
            <SelectTrigger className="h-9 text-sm dark:bg-zinc-950 dark:border-zinc-800">
              <SelectValue placeholder="Filtrar por mecânico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Mecânicos</SelectItem>
              {employees.map((emp:any) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(providedBoard) => (
            <div 
              ref={providedBoard.innerRef}
              {...providedBoard.droppableProps}
              className="flex h-full gap-3 xl:gap-4 items-start overflow-x-auto xl:overflow-x-hidden pb-6"
            >
              {COLUMNS.map((column, index) => {
                const columnOrders = filteredOrders.filter(o => o.status === column.id);
                const Icon = column.icon;

                return (
                  <Draggable key={column.id} draggableId={column.id} index={index} isDragDisabled={true}>
                    {(providedCol) => (
                      <div 
                        ref={providedCol.innerRef}
                        {...providedCol.draggableProps}
                        className="flex flex-col flex-1 w-full min-w-[280px] xl:min-w-0 shrink-0 bg-zinc-50 dark:bg-zinc-900/50 border dark:border-zinc-800/80 rounded-xl h-full max-h-[calc(100vh-210px)]"
                      >
                        <div className={`p-3 border-b rounded-t-xl flex items-center justify-between ${column.color}`}>
                          <h3 className="font-bold flex items-center gap-2 text-sm">
                            <Icon className="w-4 h-4" /> {column.title}
                          </h3>
                          <Badge variant="secondary" className="bg-white/50 dark:bg-black/20">{columnOrders.length}</Badge>
                        </div>

                        <Droppable droppableId={column.id} type="CARD">
                          {(provided, snapshot) => (
                            <div 
                              {...provided.droppableProps} 
                              ref={provided.innerRef}
                              className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-zinc-100 dark:bg-zinc-800/50' : ''}`}
                            >
                              {columnOrders.map((order, index) => (
                                <Draggable key={order.id} draggableId={order.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => openOSDetails(order)}
                                      className={`relative bg-white dark:bg-zinc-950 p-4 rounded-lg border dark:border-zinc-800 shadow-sm group cursor-pointer ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 scale-105 rotate-2' : 'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900 transition-all'}`}
                                    >
                                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-900 rounded-md shadow-sm border dark:border-zinc-800 p-0.5 z-10">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-blue-500" onClick={(e) => { e.stopPropagation(); openOSDetails(order); }}><Edit3 className="w-3.5 h-3.5"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-green-500" onClick={(e) => { e.stopPropagation(); handleWhatsApp(e, order); }}><MessageCircle className="w-3.5 h-3.5"/></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" onClick={(e) => { e.stopPropagation(); triggerPDFPrint(e, order); }}><Printer className="w-3.5 h-3.5"/></Button>
                                      </div>

                                      <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="font-mono text-xs bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">{order.vehicle.plate}</Badge>
                                        <span className="text-[10px] flex items-center gap-1 font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded-sm group-hover:opacity-0 transition-opacity">
                                          <Clock className="w-3 h-3"/> {getTimeInStatus(order.updatedAt)}
                                        </span>
                                      </div>
                                      
                                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-2">{order.vehicle.brand} {order.vehicle.model}</p>
                                      <p className="text-xs text-zinc-500 truncate mb-3 flex items-center gap-1 mt-1">
                                        <User className="w-3 h-3"/> {order.customer.name}
                                      </p>

                                      {order.mechanics.length > 0 && (
                                        <div className="flex items-center gap-1.5 mb-3 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-md border dark:border-zinc-800">
                                          <HardHat className="w-3.5 h-3.5 text-blue-500" />
                                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">
                                            {order.mechanics[0].employee?.name || 'Desconhecido'}
                                          </span>
                                        </div>
                                      )}

                                      <div className="flex justify-between items-end border-t dark:border-zinc-800 pt-3 mt-3">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">OS #{order.number}</p>
                                        <p className="font-black text-sm text-emerald-600 dark:text-emerald-400">{formatBRL(order.total)}</p>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {providedBoard.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={openViewOS} onOpenChange={(open) => {
        if (!open) { setOpenViewOS(false); setIsEditing(false); }
      }}>
        <DialogContent className="sm:max-w-[1200px] !max-w-[1200px] w-[95vw] max-h-[95vh] flex flex-col p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl">
          
          <div className="px-6 py-4 md:px-8 md:py-5 border-b dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 shrink-0 z-10 shadow-sm">
            <div className="flex justify-between items-start w-full sm:w-auto">
              <div>
                <DialogTitle className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <div className="flex items-center gap-3">
                    <span>OS #{selectedOS?.number}</span>
                    {!isEditing ? (
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
                </DialogTitle>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {isEditing ? "Modo de Edição ativado. Faça suas alterações." : "Visualizando detalhes da OS direto do Pátio."}
                </p>
              </div>

              <Button variant="ghost" size="icon" className="sm:hidden text-zinc-500 -mr-2 -mt-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => { setOpenViewOS(false); setIsEditing(false); }}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {!isEditing && (
                <>
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); setTimeout(() => { if (handlePrint) handlePrint(); }, 300); }}><Printer className="w-4 h-4 mr-2" /> Imprimir</Button>
                  <Button variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" /> Editar OS
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="text-red-500"><X className="w-4 h-4 mr-2"/> Cancelar Edição</Button>
                  <Button onClick={handleUpdateOS} className="bg-blue-600 hover:bg-blue-700 text-white"><Save className="w-4 h-4 mr-2"/> Salvar Alterações</Button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="detalhes" className="w-full h-full flex flex-col">
              <div className="px-4 md:px-8 pt-4 shrink-0 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800">
                <TabsList className="grid w-[400px] grid-cols-2 bg-zinc-100 dark:bg-zinc-950">
                  <TabsTrigger value="detalhes">Detalhes da OS</TabsTrigger>
                  <TabsTrigger value="auditoria" className="flex items-center gap-2"><History className="w-3.5 h-3.5"/> Histórico</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="detalhes" className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 m-0 border-0 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 border dark:border-zinc-800 rounded-xl shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b dark:border-zinc-800 pb-2 flex items-center gap-2"><Car className="w-4 h-4 text-zinc-400" /> Vínculo</h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cliente Solicitante *</label>
                        <Select onValueChange={setSelectedCustomerId} value={selectedCustomer} disabled={!isEditing}>
                          <SelectTrigger className={`h-10 ${!isEditing ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`}>
                            <SelectValue placeholder="Selecione o dono...">
                              {selectedCustomer ? customers.find((c:any) => c.id === selectedCustomer)?.name : "Selecione o dono..."}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>{customers.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Veículo do Cliente *</label>
                        <Select onValueChange={setSelectedVehicleId} value={selectedVehicle} disabled={!isEditing || !selectedCustomer || customerVehicles.length === 0}>
                          <SelectTrigger className={`h-10 ${!isEditing ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`}>
                            <SelectValue placeholder={customerVehicles.length > 0 ? "Selecione a placa..." : "Nenhum carro atrelado"}>
                              {selectedVehicle ? customerVehicles.find((v:any) => v.id === selectedVehicle)?.plate : "Selecione a placa..."}
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
                        <Input className={`h-10 ${!isEditing ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`} value={mileage} onChange={e => setMileage(e.target.value)} placeholder="Ex: 85.000" readOnly={!isEditing} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Combustível</label>
                        <Select onValueChange={setFuelLevel} value={fuelLevel} disabled={!isEditing}>
                          <SelectTrigger className={`h-10 ${!isEditing ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`}><SelectValue/></SelectTrigger>
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
                        <Input type="date" className={`h-10 ${!isEditing ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800 [color-scheme:light] dark:[color-scheme:dark]`} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} readOnly={!isEditing} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 border dark:border-zinc-800 rounded-xl shadow-sm space-y-4 col-span-1">
                    <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-2">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2"><HardHat className="w-4 h-4 text-zinc-400" /> Equipe na OS</h3>
                      {isEditing && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleAddMechanic}>+ Adicionar</Button>}
                    </div>
                    {mechanics.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">Nenhum mecânico atrelado.</p>
                    ) : (
                      mechanics.map((mech) => (
                        <div key={mech.id} className={`flex flex-col gap-2 p-3 ${!isEditing ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'bg-zinc-50 dark:bg-zinc-950'} border dark:border-zinc-800 rounded-md`}>
                          <Select onValueChange={(val) => updateMechanic(mech.id, "employeeId", val)} value={mech.employeeId} disabled={!isEditing}>
                            <SelectTrigger className={`h-9 text-xs ${!isEditing ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-900'} dark:border-zinc-700`}><SelectValue placeholder="Quem vai fazer?" /></SelectTrigger>
                            <SelectContent>{employees.map((emp:any) => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Input className={`h-9 text-xs flex-1 ${!isEditing ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-900'} dark:border-zinc-700`} placeholder="Tarefa (Ex: Suspensão)" value={mech.task} onChange={e => updateMechanic(mech.id, "task", e.target.value)} readOnly={!isEditing} />
                            {isEditing && <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 shrink-0" onClick={() => setMechanics(mechanics.filter(m => m.id !== mech.id))}><Trash2 className="w-4 h-4"/></Button>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 border dark:border-zinc-800 rounded-xl shadow-sm col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><AlignLeft className="w-3 h-3"/> Reclamação / Defeito</label>
                      <Textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="Motivo da visita..." className={`min-h-[80px] resize-none ${!isEditing ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'dark:bg-zinc-950'} dark:border-zinc-800`} readOnly={!isEditing} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><AlignLeft className="w-3 h-3 text-emerald-500"/> Obs Cliente (PDF)</label>
                      <Textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} placeholder="Vai aparecer no orçamento..." className={`min-h-[80px] resize-none ${!isEditing ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'dark:bg-zinc-950'} dark:border-zinc-800`} readOnly={!isEditing} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-500"/> Termo Garantia</label>
                      <Textarea value={warrantyText} onChange={e => setWarrantyText(e.target.value)} className={`min-h-[80px] resize-none text-xs ${!isEditing ? 'bg-zinc-50 dark:bg-zinc-950/50' : 'dark:bg-zinc-950'} dark:border-zinc-800`} readOnly={!isEditing} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 gap-4">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Lançamento de Itens</h3>
                    {isEditing && (
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
                            <Select onValueChange={(val) => updateItem(item.id, "productId", val)} value={item.productId} disabled={!isEditing}>
                              <SelectTrigger className={`h-10 ${!isEditing ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`}>
                                <SelectValue placeholder="Buscar peça...">
                                  {item.productId ? products.find((p:any) => p.id === item.productId)?.name : "Buscar peça..."}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>{products.map((p:any) => <SelectItem key={p.id} value={p.id}>{p.name} - {formatBRL(p.sellingPrice)}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : (
                            <Input className={`h-10 ${!isEditing ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-950'} dark:border-zinc-800`} value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} readOnly={!isEditing} />
                          )}
                        </div>
                        <div className="flex gap-3 w-full md:w-auto items-end">
                          <div className="w-20 space-y-1.5 shrink-0"><label className="text-[10px] uppercase font-bold text-zinc-500">Qtd</label><Input className={`h-10 text-center font-bold ${!isEditing ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-950'}`} type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} readOnly={!isEditing} /></div>
                          <div className="flex-1 md:w-32 space-y-1.5"><label className="text-[10px] uppercase font-bold text-zinc-500">Unitário</label><Input className={`h-10 ${!isEditing ? 'bg-transparent border-dashed' : 'bg-white dark:bg-zinc-950'}`} type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} readOnly={!isEditing} /></div>
                          <div className="flex-1 md:w-36 space-y-1.5"><label className="text-[10px] uppercase font-bold text-zinc-500">Total</label><div className={`h-10 flex items-center px-3 border dark:border-zinc-800 rounded-md font-bold text-sm ${!isEditing ? 'bg-transparent border-dashed' : 'bg-zinc-100 dark:bg-zinc-900'}`}>{formatBRL(item.total)}</div></div>
                          {isEditing && <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setItems(items.filter(i => i.id !== item.id))}><Trash2 className="w-4 h-4"/></Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="auditoria" className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 m-0 border-0 focus-visible:outline-none">
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                    <History className="w-5 h-5 text-zinc-500"/> Timeline da OS
                  </h3>
                  
                  {(!selectedOS?.history || selectedOS.history.length === 0) ? (
                    <div className="text-center py-12 border border-dashed rounded-xl border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                      <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2"/>
                      <p className="text-sm text-zinc-500">Nenhum registro de alteração de status encontrado.</p>
                      <p className="text-xs text-zinc-400 mt-1">As próximas mudanças no Kanban aparecerão aqui.</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 md:ml-4 space-y-8 pb-4">
                      {selectedOS.history.map((log: any) => (
                        <div key={log.id} className="relative pl-6 md:pl-8">
                          <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white dark:border-zinc-950 bg-blue-500 ring-4 ring-zinc-50 dark:ring-zinc-900" />
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3"/> 
                              {new Date(log.createdAt).toLocaleDateString('pt-BR')} às {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg p-4 shadow-sm mt-2">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              {log.oldStatus ? <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{getStatusName(log.oldStatus)}</Badge> : <Badge variant="secondary">Criação</Badge>}
                              <span className="text-zinc-400">→</span>
                              {getStatusBadge(log.newStatus)}
                            </div>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{log.notes || "Status alterado."}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="px-4 py-4 md:px-8 md:py-5 bg-zinc-900 dark:bg-zinc-950 border-t dark:border-zinc-800 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center z-20 gap-4 overflow-x-auto">
            <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm text-zinc-400 w-full sm:w-auto">
              <div><p className="text-[10px] font-bold uppercase mb-1">Peças</p><p className="text-lg md:text-xl text-white font-bold">{formatBRL(partsTotal)}</p></div>
              <div className="border-l border-zinc-700 pl-4 md:pl-8"><p className="text-[10px] font-bold uppercase mb-1">Serviços</p><p className="text-lg md:text-xl text-white font-bold">{formatBRL(laborTotal)}</p></div>
              
              <div className="border-l border-zinc-700 pl-4 md:pl-8">
                <p className="text-[10px] font-bold uppercase mb-1 text-emerald-400">Desconto (R$)</p>
                <Input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className={`w-24 h-8 ${!isEditing ? 'bg-transparent' : 'bg-white/10'} border-0 text-white font-bold text-base px-2`} readOnly={!isEditing} />
              </div>

              {/* NOVO: CAMPO DE ADIANTAMENTO / SINAL */}
              <div className="border-l border-zinc-700 pl-4 md:pl-8 relative">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] font-bold uppercase text-yellow-400">Sinal / Adiant.</p>
                  {isEditing && (
                    <button type="button" onClick={() => setAdvancePayment((partsTotal + laborTotal - discount) / 2)} className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded hover:bg-yellow-500/40 transition-colors">
                      50%
                    </button>
                  )}
                </div>
                <Input type="number" value={advancePayment} onChange={e => setAdvancePayment(parseFloat(e.target.value) || 0)} className={`w-28 h-8 ${!isEditing ? 'bg-transparent' : 'bg-white/10'} border-0 text-white font-bold text-base px-2`} readOnly={!isEditing} />
              </div>

            </div>
            <div className="text-left sm:text-right w-full sm:w-auto border-t border-zinc-700 sm:border-0 pt-3 sm:pt-0">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Falta Pagar</p>
              <p className="text-3xl md:text-4xl font-black text-emerald-400">{formatBRL(Math.max(0, grandTotal - advancePayment))}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div style={{ display: "none" }}><div ref={printRef}></div></div>
    </div>
  );
}