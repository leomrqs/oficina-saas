// app/login/page.tsx
import { LoginForm } from "./LoginForm";
import { Wrench, ShieldCheck, BarChart3, Users } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2 bg-zinc-50 dark:bg-zinc-950">

      {/* ── LADO ESQUERDO — Branding ── */}
      <div className="relative hidden lg:flex flex-col justify-between bg-zinc-900 dark:bg-zinc-950 p-12 overflow-hidden">

        {/* Padrão geométrico de fundo */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Gradiente de canto */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl shadow-lg">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">MecaniqControl</span>
        </div>

        {/* Texto central */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Plataforma de Gestão</p>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
              Acelere a gestão<br />
              <span className="text-blue-400">da sua oficina.</span>
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
              Do orçamento à entrega, do estoque ao financeiro. Tudo em um único lugar, para você focar no que realmente importa.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {[
              { icon: ShieldCheck, text: "Controle total de Ordens de Serviço" },
              { icon: BarChart3,   text: "DRE e financeiro em tempo real" },
              { icon: Users,       text: "Gestão de clientes e veículos" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-zinc-400 text-sm">
                <span className="flex items-center justify-center w-7 h-7 bg-zinc-800 rounded-lg shrink-0">
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Depoimento */}
        <blockquote className="relative z-10 space-y-2 border-l-2 border-blue-500/50 pl-5">
          <p className="text-zinc-300 text-sm leading-relaxed italic">
            "Depois do MecaniqControl, organizei tudo que antes estava na cabeça. Minhas OS, estoque e cobranças: tudo no controle."
          </p>
          <footer className="text-xs text-zinc-500">
            <span className="font-semibold text-zinc-400">Carlos Mendes</span> — Proprietário, Oficina Mendes & Filhos
          </footer>
        </blockquote>
      </div>

      {/* ── LADO DIREITO — Formulário ── */}
      <div className="flex flex-col items-center justify-center min-h-screen lg:min-h-0 px-6 py-12 bg-white dark:bg-zinc-900">

        {/* Logo mobile (visível só em telas menores que lg) */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-xl">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">MecaniqControl</span>
        </div>

        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
