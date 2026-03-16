// app/dashboard/equipe/ClientEmployeeManager.tsx
"use client";

import { useState } from "react";
import { Search, Plus, Trash2, Edit, HardHat, Phone, Wrench, Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createEmployee, updateEmployee, deleteEmployee, toggleEmployeeStatus } from "@/actions/employees";
import { toast } from "sonner";

export function ClientEmployeeManager({ initialData }: { initialData: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const filteredEmployees = initialData.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (formData: FormData) => {
    try {
      if (editingEmployee) {
        formData.append("id", editingEmployee.id);
        await updateEmployee(formData);
        toast.success("Funcionário atualizado!");
      } else {
        await createEmployee(formData);
        toast.success("Funcionário cadastrado com sucesso!");
      }
      setOpenModal(false);
      setEditingEmployee(null);
    } catch {
      toast.error("Erro ao salvar funcionário.");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Tem certeza que deseja excluir este funcionário? Isso pode remover o nome dele dos históricos de OS.")) return;
    try {
      await deleteEmployee(id);
      toast.success("Funcionário excluído.");
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleEmployeeStatus(id, currentStatus);
      toast.success(currentStatus ? "Funcionário desativado." : "Funcionário ativado.");
    } catch {
      toast.error("Erro ao alterar status.");
    }
  };

  const openEdit = (e: any) => {
    setEditingEmployee(e);
    setOpenModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Buscar por nome ou cargo..." className="pl-9 bg-white dark:bg-zinc-900 dark:border-zinc-800 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setEditingEmployee(null); setOpenModal(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
        </Button>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-900 dark:text-zinc-100">
              {editingEmployee ? "Editar Funcionário" : "Cadastrar Novo Funcionário"}
            </DialogTitle>
          </DialogHeader>
          <form action={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nome Completo *</label>
              <Input name="name" defaultValue={editingEmployee?.name} required className="dark:bg-zinc-900 dark:border-zinc-800" placeholder="Ex: Carlos Silva" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cargo / Especialidade *</label>
                <Input name="role" defaultValue={editingEmployee?.role} required className="dark:bg-zinc-900 dark:border-zinc-800" placeholder="Ex: Mecânico Chefe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Telefone (Opcional)</label>
                <Input name="phone" defaultValue={editingEmployee?.phone} className="dark:bg-zinc-900 dark:border-zinc-800" placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">CPF (Opcional)</label>
              <Input name="cpf" defaultValue={editingEmployee?.cpf} className="dark:bg-zinc-900 dark:border-zinc-800" placeholder="000.000.000-00" />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {editingEmployee ? "Salvar Alterações" : "Cadastrar na Equipe"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* LISTA DE FUNCIONÁRIOS (CARDS) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredEmployees.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 border border-dashed dark:border-zinc-800 rounded-lg">
            <HardHat className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Nenhum funcionário cadastrado na equipe.</p>
          </div>
        )}
        
        {filteredEmployees.map((emp) => {
          const initials = emp.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
          const servicesCount = emp.orderMechanics?.length || 0;
          
          return (
            <Card key={emp.id} className={`transition-all duration-300 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 ${!emp.isActive ? 'opacity-60 grayscale' : ''}`}>
              <CardHeader className="pb-3 flex flex-row items-start gap-4 space-y-0">
                <Avatar className="h-12 w-12 border dark:border-zinc-700">
                  <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-base font-bold truncate text-zinc-900 dark:text-zinc-100">{emp.name}</CardTitle>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate mt-0.5">{emp.role}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{emp.phone || 'Sem telefone'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Participou em <strong>{servicesCount}</strong> OS</span>
                  </div>
                  
                  <div className="pt-3 border-t dark:border-zinc-800 flex items-center justify-between">
                    <Badge variant="outline" className={emp.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"}>
                      {emp.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => openEdit(emp)} title="Editar">
                        <Edit className="w-4 h-4"/>
                      </Button>
                      <Button variant="ghost" size="icon" className={`h-8 w-8 ${emp.isActive ? 'text-orange-400 hover:text-orange-600' : 'text-emerald-400 hover:text-emerald-600'}`} onClick={() => handleToggleStatus(emp.id, emp.isActive)} title={emp.isActive ? "Desativar" : "Ativar"}>
                        {emp.isActive ? <Ban className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(emp.id)} title="Excluir">
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}