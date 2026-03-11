// app/dashboard/clientes/ClientManager.tsx
"use client";

import { useState } from "react";
import { Search, Plus, Car, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createCustomer, createVehicle } from "@/actions/customers";
import { toast } from "sonner";

// Tipagem dos dados que vêm do banco
type Vehicle = { id: string; plate: string; brand: string; model: string };
type Customer = { id: string; name: string; phone: string | null; vehicles: Vehicle[] };

export function ClientManager({ initialData }: { initialData: Customer[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openClientModal, setOpenClientModal] = useState(false);
  const [openVehicleModal, setOpenVehicleModal] = useState<string | null>(null);

  // Filtro de busca super rápido no lado do cliente
  const filteredCustomers = initialData.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vehicles.some((v) => v.plate.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handlers para os formulários usando Server Actions
  const handleCreateCustomer = async (formData: FormData) => {
    try {
      await createCustomer(formData);
      toast.success("Cliente cadastrado com sucesso!");
      setOpenClientModal(false);
    } catch (error) {
      toast.error("Erro ao cadastrar cliente.");
    }
  };

  const handleCreateVehicle = async (formData: FormData) => {
    try {
      await createVehicle(formData);
      toast.success("Veículo vinculado com sucesso!");
      setOpenVehicleModal(null);
    } catch (error) {
      toast.error("Erro ao cadastrar veículo. Verifique se a placa já existe.");
    }
  };

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR (AÇÕES E BUSCA) */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar cliente ou placa..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={openClientModal} onOpenChange={setOpenClientModal}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <form action={handleCreateCustomer} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo</label>
                <Input name="name" required placeholder="Ex: João da Silva" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone (WhatsApp)</label>
                  <Input name="phone" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPF / CNPJ</label>
                  <Input name="document" placeholder="000.000.000-00" />
                </div>
              </div>
              <Button type="submit" className="w-full">Salvar Cliente</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* GRID DE CLIENTES (OS CARDS PREMIUM) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.length === 0 && (
          <p className="text-zinc-500 text-sm">Nenhum cliente ou veículo encontrado.</p>
        )}
        
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-400" />
                {customer.name}
              </CardTitle>
              {customer.phone && (
                <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" /> {customer.phone}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Veículos</p>
                {customer.vehicles.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">Nenhum veículo vinculado.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customer.vehicles.map((v) => (
                      <Badge key={v.id} variant="secondary" className="font-mono text-xs">
                        {v.plate} - {v.brand} {v.model}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-3 border-t bg-zinc-50/50">
              <Dialog open={openVehicleModal === customer.id} onOpenChange={(isOpen) => setOpenVehicleModal(isOpen ? customer.id : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    <Car className="mr-2 h-3 w-3" /> Adicionar Veículo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Vincular Veículo a {customer.name}</DialogTitle>
                  </DialogHeader>
                  <form action={handleCreateVehicle} className="space-y-4 mt-4">
                    <input type="hidden" name="customerId" value={customer.id} />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Placa</label>
                      <Input name="plate" required placeholder="ABC-1234" className="uppercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Marca</label>
                        <Input name="brand" required placeholder="Ex: Fiat" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Modelo</label>
                        <Input name="model" required placeholder="Ex: Palio" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Salvar Veículo</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}