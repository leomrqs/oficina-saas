// components/layout/UserMenu.tsx
"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup, // <- Importação nova necessária para as versões recentes
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "US";

  return (
    <DropdownMenu>
      {/* Removemos o asChild e passamos as classes direto para o Trigger para evitar o HTML inválido */}
      <DropdownMenuTrigger className="flex w-full items-center justify-start gap-3 px-3 py-3 hover:bg-zinc-100 transition-all rounded-md outline-none">
        <Avatar className="h-9 w-9 border border-zinc-200">
          <AvatarFallback className="bg-zinc-100 text-zinc-900 font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start text-left truncate">
          <span className="text-sm font-medium leading-none truncate w-32">
            {user?.name}
          </span>
          <span className="text-xs text-zinc-500 mt-1 truncate w-32">
            {user?.role === "SUPER_ADMIN" ? "Admin SaaS" : "Gerente da Oficina"}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start" side="right" forceMount>
        {/* O Label agora é envolvido por um Group para cumprir as regras do novo Base UI */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-zinc-500">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" 
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair do sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}