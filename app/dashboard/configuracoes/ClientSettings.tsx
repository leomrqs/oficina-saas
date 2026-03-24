// app/dashboard/configuracoes/ClientSettings.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTenantSettings } from "@/actions/settings";
import { toast } from "sonner";
import { Store, FileText, Phone, MapPin, Image as ImageIcon, Save, CalendarDays } from "lucide-react";

export function ClientSettings({ tenant }: { tenant: any }) {
  
  const handleSave = async (formData: FormData) => {
    try {
      await updateTenantSettings(formData);
      toast.success("Dados da oficina atualizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações.");
    }
  };

  return (
    <Card className="max-w-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-sm">
      <CardHeader>
        <CardTitle className="text-zinc-900 dark:text-zinc-100">Ficha da Empresa</CardTitle>
        <CardDescription className="dark:text-zinc-400">Atualize as informações públicas e configurações do seu negócio.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Nome da Oficina / Razão Social</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input name="name" defaultValue={tenant.name} required className="pl-9 h-12 dark:bg-zinc-950 dark:border-zinc-800" placeholder="Ex: Auto Mecânica São José" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">CNPJ (Opcional)</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input name="cnpj" defaultValue={tenant.cnpj || ""} className="pl-9 h-12 dark:bg-zinc-950 dark:border-zinc-800" placeholder="00.000.000/0001-00" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input name="phone" defaultValue={tenant.phone || ""} className="pl-9 h-12 dark:bg-zinc-950 dark:border-zinc-800" placeholder="(11) 99999-9999" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Endereço Completo</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input name="address" defaultValue={tenant.address || ""} placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo - SP" className="pl-9 h-12 dark:bg-zinc-950 dark:border-zinc-800" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">URL da Logomarca (Opcional)</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input name="logoUrl" defaultValue={tenant.logoUrl || ""} placeholder="https://imgur...png" className="pl-9 h-12 dark:bg-zinc-950 dark:border-zinc-800" />
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1">Cole um link direto para a imagem.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider">Fechamento do Mês (Caixa)</label>
              <Select name="billingCycleDay" defaultValue={tenant.billingCycleDay?.toString() || "1"}>
                <SelectTrigger className="h-12 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100 font-medium">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                    <SelectValue placeholder="Selecione o dia" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-56 dark:bg-zinc-900 dark:border-zinc-800">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <SelectItem key={d} value={d.toString()}>Todo dia {d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1">Define de qual dia a qual dia o DRE financeiro será calculado.</p>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-md mt-4">
            <Save className="w-5 h-5 mr-2" /> Salvar Configurações da Empresa
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}