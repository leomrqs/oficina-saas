// app/dashboard/os/ClientOSManager.tsx
"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Trash2, FileText, CheckCircle, XCircle, Printer, MessageCircle, Settings, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOrder, updateOrderStatus, deleteOrder } from "@/actions/os";
import { toast } from "sonner";

export function ClientOSManager({ initialOrders, customers, products }: { initialOrders: any[], customers: any[], products: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openNewOS, setOpenNewOS] = useState(false);
  const [selectedOS, setSelectedOS] = useState<any | null>(null);

  // Filtro Global
  const filteredOrders = initialOrders.filter(o => 
    o.number.toString().includes(searchTerm) ||
    o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estados do Formulário de Nova OS
  const [selectedCustomer, setSelectedCustomerId] = useState("");
  const [selectedVehicle, setSelectedVehicleId] = useState("");
  const [mileage, setMileage] = useState("");
  const [problem, setProblem] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  
  // Itens Dinâmicos
  const [items, setItems] = useState<any[]>([]);

  const customerVehicles = useMemo(() => {
    return customers.find(c => c.id === selectedCustomer)?.vehicles || [];
  }, [selectedCustomer, customers]);

  // Cálculos Automáticos
  const partsTotal = items.filter(i => !i.isLabor).reduce((acc, curr) => acc + curr.total, 0);
  const laborTotal = items.filter(i => i.isLabor).reduce((acc, curr) => acc + curr.total, 0);
  const grandTotal = partsTotal + laborTotal - discount;

  const handleAddItem = (isLabor: boolean) => {
    setItems([...items, { id: Math.random().toString(), isLabor, name: "", productId: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Se escolheu uma peça, auto-preenche o preço
        if (field === "productId" && value) {
          const prod = products.find(p => p.id === value);
          if (prod) {
            updated.name = prod.name;
            updated.unitPrice = prod.sellingPrice;
          }
        }
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return item;
    }));
  };

  const handleSaveOS = async () => {
    if (!selectedCustomer || !selectedVehicle || items.length === 0) {
      toast.error("Selecione cliente, veículo e adicione pelo menos 1 item.");
      return;
    }

    try {
      const data = {
        customerId: selectedCustomer, vehicleId: selectedVehicle, mileage, problem, notes,
        laborTotal, partsTotal, discount, total: grandTotal, items
      };
      await createOrder(data);
      toast.success("Orçamento gerado com sucesso!");
      setOpenNewOS(false);
      // Limpa os estados
      setSelectedCustomerId(""); setSelectedVehicleId(""); setItems([]); setDiscount(0); setProblem(""); setNotes(""); setMileage("");
    } catch { toast.error("Erro ao gerar Orçamento."); }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border border-yellow-200">Orçamento</Badge>;
      case "APPROVED": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200">Em Serviço</Badge>;
      case "COMPLETED": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200">Finalizado</Badge>;
      case "CANCELED": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleWhatsApp = (os: any) => {
    if (!os.customer.phone) {
      toast.error("Cliente sem telefone cadastrado.");
      return;
    }
    const msg = `Olá ${os.customer.name}, tudo bem? Aqui é da Oficina do João.\nSegue o resumo do orçamento para o seu ${os.vehicle.brand} ${os.vehicle.model} (Placa: ${os.vehicle.plate}):\n\nTotal: *${formatBRL(os.total)}*\n\nQualquer dúvida, estamos à disposição!`;
    const url = `https://wa.me/55${os.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por cliente, placa ou nº da OS..." className="pl-9 bg-white shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <Button className="shadow-sm" onClick={() => setOpenNewOS(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Orçamento / OS
        </Button>
      </div>

      {/* ==================================================================================== */}
      {/* MODAL GIGANTE DE NOVA OS (COM OVERRIDE DE LARGURA: !max-w-6xl) */}
      {/* ==================================================================================== */}
      <Dialog open={openNewOS} onOpenChange={setOpenNewOS}>
        <DialogContent className="!max-w-[1200px] w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-50 border-zinc-200 shadow-2xl rounded-xl">
          
          {/* 1. HEADER FIXO */}
          <div className="px-8 py-5 border-b flex justify-between items-center bg-white shrink-0 z-10 shadow-sm">
            <div>
              <DialogTitle className="text-2xl font-bold text-zinc-900">Novo Orçamento da Oficina</DialogTitle>
              <p className="text-sm text-zinc-500 mt-1">Preencha os dados do veículo, adicione as peças e serviços para gerar o total.</p>
            </div>
            <div className="flex gap-3 mr-8">
              <Button variant="outline" onClick={() => setOpenNewOS(false)}>Cancelar</Button>
              <Button onClick={handleSaveOS} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">Salvar Orçamento</Button>
            </div>
          </div>

          {/* 2. CORPO ROLÁVEL (ESPAÇOSO) */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* Bloco 1: Cliente e Veículo */}
            <div className="bg-white p-6 border rounded-xl shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 mb-5 border-b pb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-zinc-400" /> Vínculo do Orçamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Selecione o Cliente</label>
                  <Select onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-12 bg-zinc-50 border-zinc-200"><SelectValue placeholder="Buscar cliente cadastrado..." /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.document || 'Sem doc'})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Veículo do Cliente</label>
                  <Select onValueChange={setSelectedVehicleId} disabled={!selectedCustomer || customerVehicles.length === 0}>
                    <SelectTrigger className="h-12 bg-zinc-50 border-zinc-200"><SelectValue placeholder={customerVehicles.length > 0 ? "Selecione o carro da garagem..." : "Nenhum carro disponível"} /></SelectTrigger>
                    <SelectContent>
                      {customerVehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bloco 2: Problema e Observações */}
            <div className="bg-white p-6 border rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quilometragem (KM)</label>
                <Input className="h-12 bg-zinc-50" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="Ex: 85.000" />
              </div>
              <div className="col-span-3 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Reclamação do Cliente (Motivo)</label>
                <Input className="h-12 bg-zinc-50" value={problem} onChange={e => setProblem(e.target.value)} placeholder="Ex: Carro roncando alto na traseira" />
              </div>
              <div className="col-span-1 md:col-span-4 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Diagnóstico / Anotações Internas</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações do mecânico sobre o serviço que será executado (Ficará salvo na OS)..." className="min-h-[100px] resize-none bg-zinc-50" />
              </div>
            </div>

            {/* Bloco 3: Itens da OS (MESA DE SERVIÇO) */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b bg-zinc-50">
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Itens do Orçamento</h3>
                  <p className="text-sm text-zinc-500">Adicione peças do estoque e valores de mão de obra.</p>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => handleAddItem(true)} className="text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100 shadow-sm">
                    <Settings className="w-4 h-4 mr-2"/> Adicionar Serviço
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleAddItem(false)} className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 shadow-sm">
                    <FileText className="w-4 h-4 mr-2"/> Adicionar Peça
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-4 bg-white">
                {items.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed rounded-xl bg-zinc-50/50">
                    <Settings className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-zinc-600">Nenhum item adicionado ainda.</p>
                    <p className="text-sm text-zinc-400 mt-1">Use os botões acima para começar a montar o orçamento.</p>
                  </div>
                )}

                {items.map((item) => (
                  <div key={item.id} className={`flex gap-4 items-end p-5 rounded-xl border shadow-sm transition-all ${item.isLabor ? 'bg-gradient-to-r from-orange-50/50 to-white border-orange-100' : 'bg-gradient-to-r from-blue-50/50 to-white border-blue-100'}`}>
                    
                    {!item.isLabor ? (
                      <div className="flex-1 space-y-2">
                        <label className="text-[11px] uppercase font-extrabold text-blue-600 tracking-wider">Peça do Estoque</label>
                        <Select onValueChange={(val) => updateItem(item.id, "productId", val)}>
                          <SelectTrigger className="h-12 bg-white border-zinc-200 text-base shadow-sm"><SelectValue placeholder="Selecione a peça..." /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - {formatBRL(p.sellingPrice)} (Estq: {p.stock})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex-1 space-y-2">
                        <label className="text-[11px] uppercase font-extrabold text-orange-600 tracking-wider">Descrição do Serviço</label>
                        <Input className="h-12 bg-white border-zinc-200 text-base shadow-sm" value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} placeholder="Ex: Mão de obra de solda e adaptação" />
                      </div>
                    )}
                    
                    <div className="w-24 space-y-2">
                      <label className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider">Qtd</label>
                      <Input className="h-12 bg-white text-center font-bold text-lg shadow-sm" type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="w-40 space-y-2">
                      <label className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider">Valor Unit (R$)</label>
                      <Input className="h-12 bg-white font-medium text-base shadow-sm" type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="w-48 space-y-2">
                      <label className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider">Total do Item</label>
                      <div className="h-12 flex items-center px-4 border rounded-md bg-zinc-100 font-bold text-zinc-900 text-lg shadow-inner">
                        {formatBRL(item.total)}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-12 w-12 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg" onClick={() => setItems(items.filter(i => i.id !== item.id))}>
                      <Trash2 className="w-5 h-5"/>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. FOOTER FIXO (TOTALIZADOR ESTILO CAIXA REGISTRADORA) */}
          <div className="px-10 py-6 bg-zinc-900 text-white shrink-0 flex justify-between items-center z-20">
            <div className="flex items-center gap-10 text-sm text-zinc-400 font-medium">
              <div>
                <p className="mb-1 uppercase tracking-wider text-[11px] font-bold">Total Peças</p>
                <p className="text-2xl text-white font-bold">{formatBRL(partsTotal)}</p>
              </div>
              <div className="border-l border-zinc-700 pl-10">
                <p className="mb-1 uppercase tracking-wider text-[11px] font-bold">Total Serviços</p>
                <p className="text-2xl text-white font-bold">{formatBRL(laborTotal)}</p>
              </div>
              <div className="border-l border-zinc-700 pl-10">
                <p className="mb-1 uppercase tracking-wider text-[11px] font-bold text-emerald-400">Desconto (R$)</p>
                <Input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-36 h-10 bg-white text-zinc-900 font-bold text-xl border-0 shadow-inner" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">Total a Pagar</p>
              <p className="text-5xl font-black text-emerald-400 leading-none tracking-tight">{formatBRL(grandTotal)}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* ==================================================================================== */}
      {/* TABELA DE ORDENS DE SERVIÇO PRINCIPAL */}
      {/* ==================================================================================== */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead>Número & Status</TableHead>
              <TableHead>Cliente / Veículo</TableHead>
              <TableHead>Problema Relatado</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-zinc-500">Nenhum orçamento encontrado.</TableCell></TableRow>
            )}
            {filteredOrders.map(os => (
              <TableRow key={os.id} className="group cursor-pointer hover:bg-zinc-50" onClick={() => setSelectedOS(os)}>
                <TableCell>
                  <p className="font-bold text-zinc-900 text-base">OS #{os.number}</p>
                  <div className="mt-1">{getStatusBadge(os.status)}</div>
                </TableCell>
                <TableCell>
                  <p className="font-bold text-sm text-zinc-900 truncate max-w-[200px]">{os.customer.name}</p>
                  <p className="text-xs font-mono text-zinc-500 mt-1">{os.vehicle.plate} - {os.vehicle.brand}</p>
                </TableCell>
                <TableCell className="max-w-[250px] truncate text-sm text-zinc-600">
                  {os.problem || "Não informado"}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right font-bold text-zinc-900">
                  {formatBRL(os.total)}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50" onClick={() => handleWhatsApp(os)} title="Enviar WhatsApp">
                      <MessageCircle className="w-4 h-4"/>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" onClick={() => toast.info("Impressão PDF em desenvolvimento!")} title="Imprimir PDF">
                      <Printer className="w-4 h-4"/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ==================================================================================== */}
      {/* MODAL DE VISUALIZAR E EDITAR STATUS DA OS (TAMBÉM CENTRALIZADO E LARGO) */}
      {/* ==================================================================================== */}
      <Dialog open={!!selectedOS} onOpenChange={(open) => !open && setSelectedOS(null)}>
        <DialogContent className="!max-w-[1000px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-50 border-zinc-200 rounded-xl shadow-2xl">
          {selectedOS && (
            <>
              {/* HEADER FIXO */}
              <div className="p-8 border-b flex justify-between items-center bg-white shrink-0 z-10 shadow-sm">
                <div>
                  <DialogTitle className="text-3xl font-black text-zinc-900 flex items-center gap-4">
                    Ordem de Serviço #{selectedOS.number}
                    {getStatusBadge(selectedOS.status)}
                  </DialogTitle>
                  <p className="text-sm text-zinc-500 mt-2">Gerada em {new Date(selectedOS.createdAt).toLocaleDateString('pt-BR')} às {new Date(selectedOS.createdAt).toLocaleTimeString('pt-BR')}</p>
                </div>
                <div className="flex gap-3 mr-8">
                  <Button variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold" onClick={async () => { await updateOrderStatus(selectedOS.id, "APPROVED"); setSelectedOS({...selectedOS, status: "APPROVED"})}}>
                    <Settings className="w-4 h-4 mr-2"/> Marcar "Em Serviço"
                  </Button>
                  <Button variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold" onClick={async () => { await updateOrderStatus(selectedOS.id, "COMPLETED"); setSelectedOS({...selectedOS, status: "COMPLETED"})}}>
                    <CheckCircle className="w-4 h-4 mr-2"/> Finalizar e Receber
                  </Button>
                </div>
              </div>

              {/* CORPO ROLÁVEL */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                
                {/* Bloco Cliente */}
                <div className="bg-white border rounded-xl p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Cliente Solicitante</p>
                    <p className="font-bold text-zinc-900 text-xl">{selectedOS.customer.name}</p>
                    <p className="text-zinc-500 text-sm mt-1 flex items-center gap-1"><MessageCircle className="w-3 h-3"/> {selectedOS.customer.phone || "Telefone não informado"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Veículo</p>
                    <div className="flex items-center gap-3 bg-zinc-100 px-4 py-2 rounded-md border inline-flex">
                      <Car className="w-5 h-5 text-zinc-500"/>
                      <span className="font-mono font-bold text-xl tracking-widest">{selectedOS.vehicle.plate}</span>
                      <span className="text-zinc-600 font-medium text-lg">- {selectedOS.vehicle.brand} {selectedOS.vehicle.model}</span>
                    </div>
                    {selectedOS.mileage && <p className="text-sm font-medium text-zinc-500 mt-2">KM Informada: {selectedOS.mileage}</p>}
                  </div>
                </div>

                {/* Itens */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b bg-zinc-50 flex items-center justify-between">
                    <p className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Detalhamento dos Itens do Pedido</p>
                  </div>
                  <div className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-50/50">
                          <TableHead className="pl-6 w-[120px]">Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-center w-[100px]">Qtd</TableHead>
                          <TableHead className="text-right w-[150px]">Unitário</TableHead>
                          <TableHead className="text-right pr-6 w-[150px]">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOS.items.map((item: any) => (
                          <TableRow key={item.id} className="h-14">
                            <TableCell className="pl-6">
                              {item.isLabor ? <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Serviço</Badge> : <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Peça</Badge>}
                            </TableCell>
                            <TableCell className="font-medium text-base text-zinc-800">{item.name}</TableCell>
                            <TableCell className="text-center font-bold text-base">{item.quantity}x</TableCell>
                            <TableCell className="text-right text-zinc-500 text-base">{formatBRL(item.unitPrice)}</TableCell>
                            <TableCell className="text-right font-bold text-zinc-900 text-base pr-6">{formatBRL(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Botão Vermelho no Fundo */}
                <div className="pt-6 pb-2 text-center border-t border-dashed mt-4">
                  <Button variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={async () => { if(confirm("Deseja cancelar esta OS permanentemente?")) {await updateOrderStatus(selectedOS.id, "CANCELED"); setSelectedOS({...selectedOS, status: "CANCELED"})}}}>
                    <XCircle className="w-4 h-4 mr-2"/> Cancelar Orçamento Inteiro
                  </Button>
                </div>
              </div>

              {/* FOOTER FIXO DA VISUALIZAÇÃO */}
              <div className="px-10 py-6 bg-zinc-900 text-white shrink-0 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.2)] z-20">
                <div className="flex items-center gap-10 text-sm text-zinc-400 font-medium">
                  <div>
                    <p className="mb-1 uppercase tracking-wider text-[11px]">Total Peças</p>
                    <p className="text-xl text-white font-bold">{formatBRL(selectedOS.partsTotal)}</p>
                  </div>
                  <div className="border-l border-zinc-700 pl-10">
                    <p className="mb-1 uppercase tracking-wider text-[11px]">Total Serviços</p>
                    <p className="text-xl text-white font-bold">{formatBRL(selectedOS.laborTotal)}</p>
                  </div>
                  {selectedOS.discount > 0 && (
                    <div className="border-l border-zinc-700 pl-10">
                      <p className="mb-1 uppercase tracking-wider text-[11px] text-red-400">Desconto Concedido</p>
                      <p className="text-xl text-red-400 font-bold">- {formatBRL(selectedOS.discount)}</p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">Total da OS</p>
                  <p className="text-4xl font-black text-emerald-400 leading-none">{formatBRL(selectedOS.total)}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}