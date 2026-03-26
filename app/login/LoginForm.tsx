// app/login/LoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Loader2, MessageCircle, AlertCircle } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      const isBlocked = result.error === "ContaBloqueada";
      toast.error(isBlocked ? "Acesso bloqueado" : "Credenciais incorretas", {
        description: isBlocked
          ? "Esta oficina está com o acesso suspenso. Contate o suporte."
          : "E-mail ou senha incorretos. Verifique e tente novamente.",
      });
      setIsLoading(false);
      return;
    }

    toast.success("Login realizado com sucesso!", {
      description: "Redirecionando para o painel...",
    });

    // REDIRECIONAMENTO DURO: Garante que o Middleware leia os cookies novos!
    window.location.href = "/dashboard";
  };

  return (
    <div className="space-y-8">

      {/* Cabeçalho */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Insira suas credenciais para acessar seu painel.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Campo E-mail */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            E-mail
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="voce@suaoficina.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="pl-9 h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Campo Senha */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="pl-9 pr-10 h-11 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus-visible:ring-blue-500 transition-all"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Botão Entrar */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm hover:-translate-y-0.5 transition-all duration-200 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar no Painel"
          )}
        </Button>
      </form>

      {/* Divisor */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white dark:bg-zinc-900 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            Informações
          </span>
        </div>
      </div>

      {/* Avisos */}
      <div className="space-y-3">

        {/* Sem registro */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
          <AlertCircle className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Sem auto-cadastro.</span>{" "}
            O acesso é criado pela equipe do MecaniqControl. Novos usuários devem contatar o suporte.
          </p>
        </div>

        {/* Esqueci a senha */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
          <MessageCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Esqueceu a senha?</span>{" "}
            Recuperação de senha é feita pelo suporte via{" "}
            <a
              href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20redefinir%20minha%20senha%20do%20MecaniqControl."
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2"
            >
              WhatsApp
            </a>
            .
          </p>
        </div>
      </div>

      {/* Rodapé */}
      <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600">
        MecaniqControl © {new Date().getFullYear()} — Todos os direitos reservados.
      </p>
    </div>
  );
}
