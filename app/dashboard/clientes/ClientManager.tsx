// app/dashboard/clientes/ClientManager.tsx
"use client";

import { useState } from "react";
import { Search, Plus, Car, User, Phone, Edit, Trash2, Calendar, FileText, MessageCircle, MoreVertical, MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createCustomer, updateCustomer, deleteCustomer, createVehicle, deleteVehicle } from "@/actions/customers";
import { toast } from "sonner";

type Vehicle = { id: string; plate: string; brand: string; model: string; year: number | null };
type Customer = { 
  id: string; name: string; document: string | null; phone: string | null; email: string | null;
  cep: string | null; street: string | null; number: string | null; complement: string | null;
  neighborhood: string | null; city: string | null; state: string | null; notes: string | null;
  vehicles: Vehicle[]; createdAt: Date 
};

export function ClientManager({ initialData }: { initialData: Customer[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openNewClient, setOpenNewClient] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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
      // Atualiza o Sheet local para UX imediata
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
    if (!confirm("Excluir permanentemente este cliente e TODOS os veículos dele?")) return;
    try {
      await deleteCustomer(id);
      toast.success("Cliente removido.");
      setSelectedCustomer(null);
    } catch { toast.error("Erro ao excluir cliente."); }
  };

  const handleCreateVehicle = async (formData: FormData) => {
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

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR E PESQUISA */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por nome, placa, CPF ou telefone..." className="pl-9 bg-white shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <Dialog open={openNewClient} onOpenChange={setOpenNewClient}>
          <DialogTrigger asChild>
            <Button className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cadastrar Novo Cliente</DialogTitle></DialogHeader>
            <form action={handleCreateCustomer} className="space-y-6 mt-4">
              
              {/* DADOS PESSOAIS */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2">Dados Pessoais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-medium text-zinc-600">Nome Completo *</label>
                    <Input name="name" required placeholder="Ex: João da Silva" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-600">WhatsApp</label>
                    <Input name="phone" placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-600">E-mail</label>
                    <Input name="email" type="email" placeholder="joao@email.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-600">CPF / CNPJ</label>
                    <Input name="document" placeholder="000.000.000-00" />
                  </div>
                </div>
              </div>

              {/* ENDEREÇO */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 border-b pb-2">Endereço</h3>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-4 space-y-2">
                    <label className="text-xs font-medium text-zinc-600">CEP</label>
                    <Input name="cep" placeholder="00000-000" />
                  </div>
                  <div className="col-span-8 space-y-2">
                    <label className="text-xs font-medium text-zinc-600">Rua / Avenida</label>
                    <Input name="street" placeholder="Rua das Flores" />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <label className="text-xs font-medium text-zinc-600">Número</label>
                    <Input name="number" placeholder="123" />
                  </div>
                  <div className="col-span-4 space-y-2">
                    <label className="text-xs font-medium text-zinc-600">Complemento</label>
                    <Input name="complement" placeholder="Apto 45" />
                  </div>
                  <div className="col-span-5 space-y-2">
                    <label className="text-xs font-medium text-zinc-600">Bairro</label>
                    <Input name="neighborhood" placeholder="Centro" />
                  </div>
                  <div className="col-span-8 space-y-2">
                    <label className="text-xs font-medium text-zinc-600">Cidade</label>
                    <Input name="city" placeholder="São Paulo" />
                  </div>
                  <div className="col-span-4 space-y-2">
                    <label className="text-xs font-medium text-zinc-600">Estado (UF)</label>
                    <Input name="state" placeholder="SP" maxLength={2} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-600">Observações (Opcional)</label>
                <Textarea name="notes" placeholder="Anotações internas sobre o cliente..." className="resize-none" />
              </div>

              <Button type="submit" className="w-full">Salvar Cliente Completo</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* GRID DE CLIENTES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white border border-dashed rounded-lg">
            <User className="mx-auto h-8 w-8 text-zinc-300 mb-3" />
            <p className="text-zinc-500 font-medium">Nenhum cliente encontrado.</p>
          </div>
        )}
        
        {filteredCustomers.map((customer) => {
          const initials = customer.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
          
          return (
            <Card key={customer.id} onClick={() => setSelectedCustomer(customer)} className="flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer border-zinc-200">
              <CardHeader className="pb-2 flex flex-row items-start gap-4 space-y-0">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback className="bg-zinc-100 text-zinc-700 text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-sm font-bold truncate">{customer.name}</CardTitle>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{customer.phone || 'Sem telefone'}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-600">
                    {customer.vehicles.length} {customer.vehicles.length === 1 ? 'veículo' : 'veículos'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CRM SHEET (O Perfil Completo Nível HubSpot) */}
      <Sheet open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-zinc-50/50">
          {selectedCustomer && (
            <>
              {/* HEADER DO PERFIL */}
              <div className="bg-white border-b px-6 py-6 pb-4 shadow-sm relative z-10">
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4 text-zinc-500"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={() => handleDeleteCustomer(selectedCustomer.id)}>
                        <Trash2 className="w-4 h-4 mr-2"/> Excluir Cliente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-4 mb-4 mt-2">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-zinc-900 text-white text-xl font-bold">
                      {selectedCustomer.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-2xl font-bold leading-tight">{selectedCustomer.name}</SheetTitle>
                    {selectedCustomer.city && selectedCustomer.state && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {selectedCustomer.city}, {selectedCustomer.state}
                      </p>
                    )}
                  </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="flex gap-2 w-full mt-4">
                  {selectedCustomer.phone && (
                    <a href={getWhatsAppLink(selectedCustomer.phone)} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" className="w-full text-green-700 border-green-200 bg-green-50 hover:bg-green-100">
                        <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                      </Button>
                    </a>
                  )}
                  {selectedCustomer.email && (
                    <a href={`mailto:${selectedCustomer.email}`} className="flex-1">
                      <Button variant="outline" className="w-full text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100">
                        <Mail className="w-4 h-4 mr-2" /> E-mail
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {/* NAVEGAÇÃO INTERNA (TABS) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <Tabs defaultValue="garage" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-zinc-200/50">
                    <TabsTrigger value="garage">Garagem</TabsTrigger>
                    <TabsTrigger value="info">Cadastro</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                  </TabsList>

                  {/* ABA: GARAGEM (VEÍCULOS) */}
                  <TabsContent value="garage" className="space-y-4">
                    {selectedCustomer.vehicles.length === 0 ? (
                      <div className="bg-white border border-dashed rounded-lg p-6 text-center">
                        <Car className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">A garagem está vazia.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {selectedCustomer.vehicles.map((v) => (
                          <div key={v.id} className="bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="bg-zinc-100 p-2 rounded-md border border-zinc-200">
                                <span className="font-mono font-bold text-sm tracking-widest text-zinc-900">{v.plate}</span>
                              </div>
                              <div>
                                <p className="font-bold text-sm text-zinc-800">{v.brand} {v.model}</p>
                                <p className="text-xs text-zinc-500">Ano: {v.year || 'N/I'}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteVehicle(v.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <form action={handleCreateVehicle} className="mt-6 bg-white p-4 rounded-lg border shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-900"></div>
                      <p className="text-sm font-bold text-zinc-900 mb-4 pl-2">Adicionar Novo Veículo</p>
                      <input type="hidden" name="customerId" value={selectedCustomer.id} />
                      <div className="grid grid-cols-2 gap-3 mb-3 pl-2">
                        <Input name="plate" placeholder="Placa (Ex: ABC-1234)" required className="uppercase text-xs" />
                        <Input name="year" type="number" placeholder="Ano" className="text-xs" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4 pl-2">
                        <Input name="brand" placeholder="Marca (Ex: Fiat)" required className="text-xs" />
                        <Input name="model" placeholder="Modelo (Ex: Palio)" required className="text-xs" />
                      </div>
                      <Button type="submit" variant="secondary" className="w-full text-xs ml-2 w-[calc(100%-8px)]"><Plus className="w-4 h-4 mr-2"/> Salvar na Garagem</Button>
                    </form>
                  </TabsContent>

                  {/* ABA: DADOS CADASTRAIS (EDITAR) */}
                  <TabsContent value="info">
                    <form action={handleUpdateCustomer} className="bg-white p-5 rounded-lg border shadow-sm space-y-6">
                      <input type="hidden" name="id" value={selectedCustomer.id} />
                      
                      <div className="space-y-4">
                        <p className="text-sm font-semibold text-zinc-900 border-b pb-1">Contato</p>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nome Completo</label>
                          <Input name="name" defaultValue={selectedCustomer.name} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">WhatsApp</label>
                            <Input name="phone" defaultValue={selectedCustomer.phone || ""} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">E-mail</label>
                            <Input name="email" defaultValue={selectedCustomer.email || ""} type="email" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CPF / CNPJ</label>
                          <Input name="document" defaultValue={selectedCustomer.document || ""} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-sm font-semibold text-zinc-900 border-b pb-1">Endereço</p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-1 space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CEP</label>
                            <Input name="cep" defaultValue={selectedCustomer.cep || ""} />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bairro</label>
                            <Input name="neighborhood" defaultValue={selectedCustomer.neighborhood || ""} />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="col-span-3 space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Rua</label>
                            <Input name="street" defaultValue={selectedCustomer.street || ""} />
                          </div>
                          <div className="col-span-1 space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nº</label>
                            <Input name="number" defaultValue={selectedCustomer.number || ""} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cidade</label>
                            <Input name="city" defaultValue={selectedCustomer.city || ""} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">UF</label>
                            <Input name="state" defaultValue={selectedCustomer.state || ""} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Observações / Lembretes</label>
                        <Textarea name="notes" defaultValue={selectedCustomer.notes || ""} className="min-h-[100px] resize-none" />
                      </div>

                      <Button type="submit" className="w-full"><Edit className="w-4 h-4 mr-2"/> Salvar Alterações</Button>
                    </form>
                  </TabsContent>

                  {/* ABA: HISTÓRICO */}
                  <TabsContent value="history">
                    <div className="bg-white border border-dashed rounded-lg p-8 text-center mt-4">
                      <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-zinc-900">Histórico de OS</h4>
                      <p className="text-xs text-zinc-500 mt-1 max-w-[250px] mx-auto">
                        Módulo integrado com Ordens de Serviço (em breve).
                      </p>
                    </div>
                  </TabsContent>

                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}