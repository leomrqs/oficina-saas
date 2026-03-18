// app/dashboard/clientes/ClientManager.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Car, User, Trash2, Calendar, FileText, MessageCircle, MapPin, Mail, Wrench, Save, X, ExternalLink, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCustomer, updateCustomer, deleteCustomer, createVehicle, deleteVehicle } from "@/actions/customers";
import { toast } from "sonner";

const CAR_BRANDS = [
  "Audi", "BMW", "Caoa Chery", "Chevrolet", "Citroën", "Fiat", "Ford", "Honda", 
  "Hyundai", "Jeep", "Kia", "Land Rover", "Mercedes-Benz", "Mitsubishi", 
  "Nissan", "Peugeot", "Porsche", "Renault", "Toyota", "Volkswagen", "Volvo", "Outra"
];

type Order = { id: string; number: number; status: string; total: number; createdAt: Date; problem: string | null };
type Vehicle = { id: string; plate: string; brand: string; model: string; version: string | null; year: number | null };
type Customer = { 
  id: string; name: string; document: string | null; phone: string | null; email: string | null;
  cep: string | null; street: string | null; number: string | null; complement: string | null;
  neighborhood: string | null; city: string | null; state: string | null; notes: string | null;
  vehicles: Vehicle[]; orders: Order[]; createdAt: Date 
};

export function ClientManager({ initialData }: { initialData: Customer[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openNewClient, setOpenNewClient] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [cepConfig, setCepConfig] = useState({ cep: '', street: '', neighborhood: '', city: '', state: '' });
  const [newVehicleBrand, setNewVehicleBrand] = useState("");

  useEffect(() => {
    if (selectedCustomer) {
      setCepConfig({
        cep: selectedCustomer.cep || '',
        street: selectedCustomer.street || '',
        neighborhood: selectedCustomer.neighborhood || '',
        city: selectedCustomer.city || '',
        state: selectedCustomer.state || ''
      });
      setNewVehicleBrand("");
    } else {
      setCepConfig({ cep: '', street: '', neighborhood: '', city: '', state: '' });
      setNewVehicleBrand("");
    }
  }, [selectedCustomer, openNewClient]);

  const handleCepChange = async (val: string) => {
    setCepConfig(prev => ({ ...prev, cep: val }));
    const cleanCep = val.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setCepConfig(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
          toast.success("Endereço preenchido automaticamente!");
        }
      } catch (err) {
        // Silencioso se der erro na API
      }
    }
  };

  const filteredCustomers = initialData.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vehicles.some((v) => v.plate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.document?.includes(searchTerm) ||
      c.phone?.includes(searchTerm)
  );

  const getWhatsAppLink = (phone: string | null) => {
    if (!phone) return "#";
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}`;
  };

  const handleCreateCustomer = async (formData: FormData) => {
    try {
      await createCustomer(formData);
      toast.success("Cliente cadastrado com sucesso!");
      setOpenNewClient(false);
    } catch { toast.error("Erro ao cadastrar cliente."); }
  };

  const handleUpdateCustomer = async (formData: FormData) => {
    try {
      await updateCustomer(formData);
      toast.success("Ficha atualizada com sucesso!");
      setSelectedCustomer(prev => prev ? { 
        ...prev, 
        name: formData.get('name') as string, 
        phone: formData.get('phone') as string,
        document: formData.get('document') as string,
        email: formData.get('email') as string,
        cep: formData.get('cep') as string,
        street: formData.get('street') as string,
        number: formData.get('number') as string,
        complement: formData.get('complement') as string,
        neighborhood: formData.get('neighborhood') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        notes: formData.get('notes') as string,
      } : null);
    } catch { toast.error("Erro ao atualizar ficha."); }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("⚠️ ALERTA: Tem certeza que deseja excluir permanentemente este cliente e TODOS os veículos dele?")) return;
    try {
      await deleteCustomer(id);
      toast.success("Cliente removido.");
      setSelectedCustomer(null);
    } catch { toast.error("Erro ao excluir cliente."); }
  };

  const handleCreateVehicle = async (formData: FormData) => {
    if (!newVehicleBrand) {
      toast.error("Por favor, selecione a marca do veículo.");
      return;
    }
    try {
      await createVehicle(formData);
      toast.success("Veículo na garagem!");
      setSelectedCustomer(null); 
    } catch { toast.error("Erro ao adicionar veículo."); }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Remover veículo da garagem?")) return;
    try {
      await deleteVehicle(id);
      toast.success("Veículo removido.");
      setSelectedCustomer(null);
    } catch { toast.error("Erro ao remover veículo."); }
  };

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-500">Orçamento</Badge>;
      case "APPROVED": return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400">Em Serviço</Badge>;
      case "COMPLETED": return <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">Finalizada</Badge>;
      case "CANCELED": return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">Cancelada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const totalGasto = selectedCustomer?.orders
    .filter(os => os.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.total, 0) || 0;
    
  const servicosFinalizados = selectedCustomer?.orders.filter(os => os.status === "COMPLETED").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por nome, placa, CPF ou telefone..." className="pl-9 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {/* MODAL DE CRIAÇÃO DE NOVO CLIENTE (REFEITO PREMIUM) */}
        <Dialog open={openNewClient} onOpenChange={setOpenNewClient}>
          <DialogTrigger asChild>
            <Button className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white"><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] w-[95vw] h-[90vh] sm:h-auto max-h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl">
            
            <div className="px-6 py-5 border-b dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 z-10 shadow-sm flex justify-between items-center">
              <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-500"/>
                </div>
                Cadastrar Novo Cliente
              </DialogTitle>
              <Button variant="ghost" size="icon" className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setOpenNewClient(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <form action={handleCreateCustomer} className="space-y-6 max-w-3xl mx-auto" id="new-customer-form">
                
                <div className="space-y-4 bg-white dark:bg-zinc-900 p-6 rounded-xl border dark:border-zinc-800 shadow-sm">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b dark:border-zinc-800 pb-2">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome Completo *</label>
                      <Input name="name" required placeholder="Ex: João da Silva" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">WhatsApp</label>
                      <Input name="phone" placeholder="(11) 99999-9999" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">E-mail</label>
                      <Input name="email" type="email" placeholder="joao@email.com" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CPF / CNPJ</label>
                      <Input name="document" placeholder="000.000.000-00" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-white dark:bg-zinc-900 p-6 rounded-xl border dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-2">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Endereço</h3>
                    <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Search className="w-3 h-3"/> Busca Inteligente via CEP</span>
                  </div>
                  <div className="grid grid-cols-12 gap-5">
                    <div className="col-span-12 md:col-span-4 space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CEP</label>
                      <Input name="cep" value={cepConfig.cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                    <div className="col-span-12 md:col-span-8 space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Rua / Avenida</label>
                      <Input name="street" value={cepConfig.street} onChange={e => setCepConfig({...cepConfig, street: e.target.value})} placeholder="Rua das Flores" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                    <div className="col-span-6 md:col-span-3 space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Número</label>
                      <Input name="number" placeholder="123" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                    <div className="col-span-6 md:col-span-4 space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Complemento</label>
                      <Input name="complement" placeholder="Apto 45" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                    <div className="col-span-12 md:col-span-5 space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bairro</label>
                      <Input name="neighborhood" value={cepConfig.neighborhood} onChange={e => setCepConfig({...cepConfig, neighborhood: e.target.value})} placeholder="Centro" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                    <div className="col-span-8 space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cidade</label>
                      <Input name="city" value={cepConfig.city} onChange={e => setCepConfig({...cepConfig, city: e.target.value})} placeholder="São Paulo" className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                    <div className="col-span-4 space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">UF</label>
                      <Input name="state" value={cepConfig.state} onChange={e => setCepConfig({...cepConfig, state: e.target.value})} placeholder="SP" maxLength={2} className="bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 h-11" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-white dark:bg-zinc-900 p-6 rounded-xl border dark:border-zinc-800 shadow-sm">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2"><FileText className="w-4 h-4 text-zinc-400"/> Observações / Lembretes</label>
                  <Textarea name="notes" placeholder="Anotações internas importantes sobre este novo cliente..." className="mt-2 bg-zinc-50 resize-none dark:bg-zinc-950 dark:border-zinc-800 min-h-[100px]" />
                </div>

              </form>
            </div>
            <div className="px-6 py-4 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0 z-10">
              <Button type="submit" form="new-customer-form" className="w-full h-12 text-md bg-blue-600 hover:bg-blue-700 text-white font-bold"><Save className="w-5 h-5 mr-2"/> Cadastrar Cliente</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* CARDS DE CLIENTES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 border border-dashed dark:border-zinc-800 rounded-lg">
            <User className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-zinc-500 font-medium">Nenhum cliente encontrado.</p>
          </div>
        )}
        
        {filteredCustomers.map((customer) => {
          const initials = customer.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
          
          return (
            <Card key={customer.id} onClick={() => setSelectedCustomer(customer)} className="flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
              <CardHeader className="pb-2 flex flex-row items-start gap-4 space-y-0">
                <Avatar className="h-10 w-10 border dark:border-zinc-800">
                  <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-sm font-bold truncate dark:text-zinc-100">{customer.name}</CardTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{customer.phone || 'Sem telefone'}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-2 flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {customer.vehicles.length} {customer.vehicles.length === 1 ? 'veículo' : 'veículos'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                   <Calendar className="w-3 h-3"/> {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MODAL GIGANTE DE DETALHES DO CLIENTE */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-[1200px] !max-w-[1200px] w-[95vw] h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl">
          
          {/* HEADER DO MODAL */}
          <div className="px-6 py-4 md:px-8 md:py-5 border-b dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 shrink-0 z-10 shadow-sm">
             <div className="flex items-center gap-4">
               <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-white dark:border-zinc-800 shadow-sm">
                 <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-lg font-bold">
                   {selectedCustomer?.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                 </AvatarFallback>
               </Avatar>
               <div>
                 <DialogTitle className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {selectedCustomer?.name}
                 </DialogTitle>
                 <p className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> CPF/CNPJ: {selectedCustomer?.document || 'N/I'}</span>
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Cliente desde: {selectedCustomer ? new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR') : ''}</span>
                 </p>
               </div>
             </div>

             <div className="flex flex-wrap gap-2 w-full sm:w-auto">
               {selectedCustomer?.phone && (
                 <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-500" onClick={() => window.open(getWhatsAppLink(selectedCustomer.phone!), '_blank')}>
                   <MessageCircle className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">WhatsApp</span>
                 </Button>
               )}
               {selectedCustomer?.email && (
                 <Button variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-500" onClick={() => window.location.href = `mailto:${selectedCustomer.email}`}>
                   <Mail className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">E-mail</span>
                 </Button>
               )}
               
               <Button variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-500" onClick={() => handleDeleteCustomer(selectedCustomer!.id)}>
                 <Trash2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Excluir Cliente</span>
               </Button>
               
               <Button variant="ghost" size="icon" className="sm:hidden text-zinc-500" onClick={() => setSelectedCustomer(null)}>
                 <X className="w-5 h-5" />
               </Button>
             </div>
          </div>

          {/* ÁREA DE TABS */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="info" className="w-full h-full flex flex-col">
              <div className="px-4 md:px-8 pt-4 shrink-0 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800">
                 <TabsList className="grid w-full sm:w-[500px] grid-cols-3 bg-zinc-100 dark:bg-zinc-950 mb-0 rounded-b-none">
                    <TabsTrigger value="info">Cadastro</TabsTrigger>
                    <TabsTrigger value="garage">Garagem</TabsTrigger>
                    <TabsTrigger value="history">Histórico de OS</TabsTrigger>
                 </TabsList>
              </div>

              {/* CONTEÚDO: CADASTRO */}
              <TabsContent value="info" className="flex-1 overflow-y-auto p-4 md:p-8 m-0 border-0 focus-visible:outline-none">
                <form action={handleUpdateCustomer} className="bg-white dark:bg-zinc-900 p-5 md:p-8 rounded-xl border dark:border-zinc-800 shadow-sm space-y-8 max-w-4xl mx-auto">
                  <input type="hidden" name="id" value={selectedCustomer?.id} />
                  
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b dark:border-zinc-800 pb-2">Informações de Contato</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome Completo</label>
                        <Input name="name" defaultValue={selectedCustomer?.name} required className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">WhatsApp</label>
                        <Input name="phone" defaultValue={selectedCustomer?.phone || ""} className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">E-mail</label>
                        <Input name="email" defaultValue={selectedCustomer?.email || ""} type="email" className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CPF / CNPJ</label>
                        <Input name="document" defaultValue={selectedCustomer?.document || ""} className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-2">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Endereço</p>
                      <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Search className="w-3 h-3"/> Busca Inteligente de CEP</span>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-4 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CEP</label>
                        <Input name="cep" value={cepConfig.cep} onChange={e => handleCepChange(e.target.value)} className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      <div className="col-span-12 md:col-span-8 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Rua / Avenida</label>
                        <Input name="street" value={cepConfig.street} onChange={e => setCepConfig({...cepConfig, street: e.target.value})} className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      <div className="col-span-6 md:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Número</label>
                        <Input name="number" defaultValue={selectedCustomer?.number || ""} className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      <div className="col-span-6 md:col-span-4 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Complemento</label>
                        <Input name="complement" defaultValue={selectedCustomer?.complement || ""} className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      <div className="col-span-12 md:col-span-5 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bairro</label>
                        <Input name="neighborhood" value={cepConfig.neighborhood} onChange={e => setCepConfig({...cepConfig, neighborhood: e.target.value})} className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      <div className="col-span-8 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cidade</label>
                        <Input name="city" value={cepConfig.city} onChange={e => setCepConfig({...cepConfig, city: e.target.value})} className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      <div className="col-span-4 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado (UF)</label>
                        <Input name="state" value={cepConfig.state} onChange={e => setCepConfig({...cepConfig, state: e.target.value})} maxLength={2} className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4"/> Observações / Histórico Médico</label>
                    <Textarea name="notes" defaultValue={selectedCustomer?.notes || ""} className="min-h-[120px] resize-none dark:bg-zinc-950 dark:border-zinc-800" placeholder="Anotações importantes sobre o cliente..." />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-md font-bold"><Save className="w-5 h-5 mr-2"/> Salvar Alterações Cadastrais</Button>
                </form>
              </TabsContent>

              {/* CONTEÚDO: GARAGEM (VEÍCULOS) */}
              <TabsContent value="garage" className="flex-1 overflow-y-auto p-4 md:p-8 m-0 border-0 focus-visible:outline-none">
                <div className="max-w-5xl mx-auto space-y-8">
                  
                  {/* LISTA DE VEÍCULOS CHIQUE */}
                  {selectedCustomer?.vehicles.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-dashed dark:border-zinc-800 rounded-lg p-12 text-center shadow-sm">
                      <Car className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Garagem Vazia</h4>
                      <p className="text-sm text-zinc-500 mt-1">Este cliente ainda não possui veículos cadastrados.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCustomer?.vehicles.map((v) => (
                        <div key={v.id} className="bg-white dark:bg-zinc-900/80 p-5 rounded-2xl border dark:border-zinc-800 shadow-sm flex items-center justify-between group hover:border-blue-300 dark:hover:border-blue-900 transition-all relative overflow-hidden">
                          {/* Marca d'água */}
                          <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-5 pointer-events-none">
                            <Car className="w-32 h-32" />
                          </div>
                          
                          <div className="flex items-center gap-4 relative z-10">
                            <div className="bg-zinc-900 dark:bg-zinc-100 px-3 py-2 rounded-lg flex flex-col items-center justify-center min-w-[90px] shadow-inner">
                              <span className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest mb-0.5">Brasil</span>
                              <span className="font-mono font-black text-sm tracking-wider text-white dark:text-zinc-900">{v.plate}</span>
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-[9px] uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-0">{v.brand}</Badge>
                                {v.year && <Badge variant="outline" className="text-[9px] text-zinc-500 border-zinc-200 dark:border-zinc-700">{v.year}</Badge>}
                              </div>
                              <p className="font-black text-lg text-zinc-800 dark:text-zinc-100 uppercase leading-none truncate max-w-[180px]">{v.model}</p>
                              {v.version && <p className="text-xs text-zinc-500 font-medium mt-1 truncate max-w-[180px]" title={v.version}>{v.version}</p>}
                            </div>
                          </div>

                          <Button variant="ghost" size="icon" className="relative z-10 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDeleteVehicle(v.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FORMULÁRIO DE NOVO VEÍCULO */}
                  <form action={handleCreateVehicle} className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border dark:border-zinc-800 shadow-sm">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2 border-b dark:border-zinc-800 pb-2"><Plus className="w-4 h-4 text-blue-500"/> Adicionar Novo Veículo</p>
                    <input type="hidden" name="customerId" value={selectedCustomer?.id} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4">
                      <div className="sm:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Placa *</label>
                        <Input name="plate" placeholder="ABC-1234" required className="uppercase font-mono dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      
                      <div className="sm:col-span-3 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Marca *</label>
                        <input type="hidden" name="brand" value={newVehicleBrand} />
                        <Select onValueChange={setNewVehicleBrand} required>
                          <SelectTrigger className="h-10 dark:bg-zinc-950 dark:border-zinc-800">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] dark:bg-zinc-900 dark:border-zinc-800">
                            {CAR_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-4 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Modelo *</label>
                        <Input name="model" placeholder="Ex: Onix, Corolla..." required className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                      
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ano</label>
                        <Input name="year" type="number" placeholder="2018" className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>

                      <div className="sm:col-span-12 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">Versão / Motor <span className="text-zinc-400 font-normal">(Opcional)</span></label>
                        <Input name="version" placeholder="Ex: 1.4 MPFI LTZ 8V FLEX" className="dark:bg-zinc-950 dark:border-zinc-800 h-10" />
                      </div>
                    </div>
                    <Button type="submit" variant="secondary" className="w-full h-11 font-bold dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 mt-2">Salvar na Garagem</Button>
                  </form>
                </div> 
              </TabsContent>

              {/* CONTEÚDO: HISTÓRICO DE OS (TURBINADO E CLICÁVEL COM LTV) */}
              <TabsContent value="history" className="flex-1 overflow-y-auto p-4 md:p-8 m-0 border-0 focus-visible:outline-none">
                <div className="max-w-4xl mx-auto space-y-6">

                  {/* PAINEL FINANCEIRO (LTV) */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 flex items-center justify-between w-full shadow-sm">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Total Gasto (LTV)</p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatBRL(totalGasto)}</p>
                      </div>
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-lg">
                        <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                      </div>
                    </div>
                    
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between w-full shadow-sm">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Serviços Concluídos</p>
                        <p className="text-2xl font-black text-zinc-700 dark:text-zinc-300">{servicosFinalizados}</p>
                      </div>
                      <div className="bg-zinc-200 dark:bg-zinc-800 p-3 rounded-lg">
                        <CheckCircle2 className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
                      </div>
                    </div>
                  </div>

                  {/* LISTA DE OS */}
                  <div className="space-y-4">
                    {selectedCustomer?.orders && selectedCustomer.orders.length > 0 ? (
                      selectedCustomer.orders.map(os => (
                        <Link 
                          key={os.id} 
                          href={`/dashboard/os?open=${os.id}`} 
                          className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-300 dark:hover:border-blue-800 transition-all relative block"
                          title="Ir para o painel de Ordens de Serviço"
                        >
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ExternalLink className="w-4 h-4 text-blue-500" />
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg flex flex-col items-center min-w-[70px] shrink-0 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">OS</span>
                              <span className="text-lg font-black text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">#{os.number}</span>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(os.status)}
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 max-w-md pr-6">
                                {os.problem ? `"${os.problem}"` : <span className="italic text-zinc-400">Nenhum defeito relatado na abertura.</span>}
                              </p>
                            </div>
                          </div>

                          <div className="text-left sm:text-right bg-zinc-50 dark:bg-zinc-800/50 sm:bg-transparent sm:dark:bg-transparent p-3 sm:p-0 rounded-lg shrink-0 mt-2 sm:mt-0 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest sm:mb-1">Valor Total</p>
                            <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">{formatBRL(os.total)}</span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="bg-white dark:bg-zinc-900 border border-dashed dark:border-zinc-800 rounded-lg p-12 text-center shadow-sm mt-4">
                        <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Nenhum Serviço Realizado</h4>
                        <p className="text-sm text-zinc-500 mt-1 max-w-[300px] mx-auto">
                          As Ordens de Serviço (Orçamentos e Serviços Aprovados) deste cliente aparecerão aqui automaticamente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}