// app/dashboard/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { Menu, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
      {/* SIDEBAR DESKTOP */}
      <div className="hidden border-r bg-zinc-50/50 md:flex flex-col">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Wrench className="h-6 w-6" />
            <span className="">Oficina SaaS</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-auto py-4">
          <Sidebar role={session?.user?.role} />
        </div>

        {/* HUD DO USUÁRIO NO RODAPÉ */}
        <div className="mt-auto border-t p-2">
          <UserMenu user={session?.user as any} /> 
        </div>
      </div>

      <div className="flex flex-col">
        {/* HEADER & MENU MOBILE (Sheet) */}
        <header className="flex h-14 items-center gap-4 border-b bg-zinc-50/50 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            {/* Correção do botão duplo: Tiramos o "asChild" e passamos as classes diretamente */}
            <SheetTrigger className="inline-flex items-center justify-center shrink-0 md:hidden h-10 w-10 border border-zinc-200 rounded-md hover:bg-zinc-100 bg-white">
              <Menu className="h-5 w-5 text-zinc-900" />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            
            <SheetContent side="left" className="flex flex-col h-full">
              <SheetTitle className="flex items-center gap-2 font-semibold mb-4">
                <Wrench className="h-6 w-6" />
                Oficina SaaS
              </SheetTitle>
              
              <div className="flex-1 overflow-auto">
                <Sidebar role={session?.user?.role} />
              </div>

              <div className="mt-auto border-t pt-4">
                <UserMenu user={session?.user as any} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1" />
        </header>

        {/* ÁREA DE CONTEÚDO */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}