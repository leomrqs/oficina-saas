// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, FileText, DollarSign, Settings, Building, HardHat } from "lucide-react";

const managerItems = [
  { name: "Painel da Oficina", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orçamentos & OS", href: "/dashboard/os", icon: FileText },
  { name: "Clientes & Veículos", href: "/dashboard/clientes", icon: Users },
  { name: "Estoque & Peças", href: "/dashboard/estoque", icon: Package },
  { name: "Equipe & Mecânicos", href: "/dashboard/equipe", icon: HardHat }, // NOVO: Link da Equipe
  { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign },
  { name: "Minha Empresa", href: "/dashboard/configuracoes", icon: Settings },
];

const superAdminItems = [
  { name: "Visão Geral SaaS", href: "/dashboard", icon: LayoutDashboard },
  { name: "Gestão de Oficinas", href: "/dashboard/oficinas", icon: Building },
  { name: "Faturamento SaaS", href: "/dashboard/faturamento", icon: DollarSign },
];

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const navItems = role === "SUPER_ADMIN" ? superAdminItems : managerItems;

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              isActive
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}