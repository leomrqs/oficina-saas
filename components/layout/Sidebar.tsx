// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, LayoutDashboard, Users, Package, FileText, DollarSign, Settings } from "lucide-react";

const navItems = [
  { name: "Painel", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes & Veículos", href: "/dashboard/clientes", icon: Users },
  { name: "Estoque", href: "/dashboard/estoque", icon: Package },
  { name: "Orçamentos & OS", href: "/dashboard/os", icon: FileText },
  { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

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
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
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