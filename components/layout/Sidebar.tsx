// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Package, FileText, DollarSign, Settings, Building, HardHat, LayoutGrid, Loader2, CalendarDays, Megaphone, ScrollText, ShieldCheck } from "lucide-react";

// MENU DO DONO/GERENTE (Acesso Total)
const managerItems = [
  { name: "Painel da Oficina", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: CalendarDays },
  { name: "Pátio (Kanban)", href: "/dashboard/patio", icon: LayoutGrid }, 
  { name: "Orçamentos & OS", href: "/dashboard/os", icon: FileText },
  { name: "Clientes & Veículos", href: "/dashboard/clientes", icon: Users },
  { name: "Estoque & Peças", href: "/dashboard/estoque", icon: Package },
  { name: "Equipe & Mecânicos", href: "/dashboard/equipe", icon: HardHat }, 
  { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign },
  { name: "Minha Empresa", href: "/dashboard/configuracoes", icon: Settings },
];

// MENU DO MECÂNICO (Acesso Restrito - Sem Dinheiro e Configurações)
const mechanicItems = [
  { name: "Painel de Serviços", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: CalendarDays },
  { name: "Pátio (Kanban)", href: "/dashboard/patio", icon: LayoutGrid },
  { name: "Orçamentos & OS", href: "/dashboard/os", icon: FileText },
  { name: "Clientes & Veículos", href: "/dashboard/clientes", icon: Users },
  { name: "Consulta de Estoque", href: "/dashboard/estoque", icon: Package },
];

const superAdminItems = [
  { name: "Visão Geral SaaS", href: "/dashboard", icon: LayoutDashboard },
  { name: "Gestão de Oficinas", href: "/dashboard/oficinas", icon: Building },
  { name: "Faturamento SaaS", href: "/dashboard/faturamento", icon: DollarSign },
  { name: "Comunicados", href: "/dashboard/comunicados", icon: Megaphone },
  { name: "Logs de Auditoria", href: "/dashboard/logs", icon: ScrollText },
  { name: "Meu Perfil", href: "/dashboard/perfil", icon: ShieldCheck },
];

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  
  useEffect(() => {
    setIsNavigating(null);
  }, [pathname]);

  let navItems = managerItems;
  if (role === "SUPER_ADMIN") {
    navItems = superAdminItems;
  } else if (role === "MECHANIC") {
    navItems = mechanicItems;
  }

  return (
    <nav className="grid items-start px-3 text-sm lg:px-4 space-y-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        const isLoading = isNavigating === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              if (pathname !== item.href) {
                setIsNavigating(item.href); 
              }
            }}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300 overflow-hidden ${
              isActive
                ? "bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-bold shadow-sm"
                : "text-zinc-600 hover:text-blue-600 hover:bg-blue-50/50 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-zinc-900/80 font-medium hover:translate-x-1"
            }`}
          >
            {/* Barra iluminada de aba ativa */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
            )}

            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
            )}
            
            <span className="tracking-wide">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}