// app/dashboard/perfil/page.tsx
"use client";

import { useState } from "react";
import { changePassword } from "@/actions/profile";
import { toast } from "sonner";
import { ShieldCheck, Lock, Save, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PerfilPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem!");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Senha atualizada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full pt-4 md:pt-10">
      <div className="mb-6 px-4 md:px-0">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-blue-500" /> Meu Perfil
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">Gerencie a segurança da sua conta e altere sua senha de acesso.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mx-4 md:mx-0">
        <div className="p-4 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-zinc-500" />
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Alterar Senha</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Senha Atual</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                type="password" 
                required
                className="pl-9 dark:bg-zinc-950 dark:border-zinc-800 h-11" 
                placeholder="Digite sua senha atual" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-blue-500">Nova Senha</label>
              <Input 
                type="password" 
                required
                className="dark:bg-zinc-950 dark:border-zinc-800 h-11 border-blue-200 dark:border-blue-900 focus-visible:ring-blue-500" 
                placeholder="Mínimo 6 caracteres" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-blue-500">Confirme a Nova Senha</label>
              <Input 
                type="password" 
                required
                className="dark:bg-zinc-950 dark:border-zinc-800 h-11 border-blue-200 dark:border-blue-900 focus-visible:ring-blue-500" 
                placeholder="Repita a nova senha" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
              />
            </div>
          </div>

          <div className="pt-4 border-t dark:border-zinc-800 flex justify-end">
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-8">
              {loading ? "Salvando..." : <><Save className="w-4 h-4 mr-2"/> Salvar Nova Senha</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}