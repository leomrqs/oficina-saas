// app/dashboard/configuracoes/ClientSettings.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateTenantSettings } from "@/actions/settings";
import { toast } from "sonner";
import { Store, FileText, Phone, MapPin, Image as ImageIcon, Save } from "lucide-react";

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
        <CardDescription className="dark:text-zinc-400">Atualize as informações públicas do seu negócio.</CardDescription>
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

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">URL da Logomarca (Opcional)</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input name="logoUrl" defaultValue={tenant.logoUrl || ""} placeholder="https://imgur.com/minha-logo.png" className="pl-9 h-12 dark:bg-zinc-950 dark:border-zinc-800" />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1">Cole um link direto para a imagem da sua logo. O upload de arquivos direto será implementado na próxima versão.</p>
          </div>

          <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-md">
            <Save className="w-5 h-5 mr-2" /> Salvar Configurações da Empresa
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}