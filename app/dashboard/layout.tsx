// app/dashboard/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { Menu, Wrench, CircleUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr]">
      {/* SIDEBAR DESKTOP */}
      <div className="hidden border-r bg-zinc-50/50 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Wrench className="h-6 w-6" />
              <span className="">Oficina SaaS</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <Sidebar />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* HEADER & MENU MOBILE (Sheet) */}
        <header className="flex h-14 items-center gap-4 border-b bg-zinc-50/50 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SheetTitle className="flex items-center gap-2 font-semibold mb-4">
                <Wrench className="h-6 w-6" />
                Oficina SaaS
              </SheetTitle>
              <Sidebar />
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1" /> {/* Espaçador */}

          {/* PERFIL DO USUÁRIO */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{session?.user?.role}</p>
            </div>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Menu do usuário</span>
            </Button>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO (Onde as páginas entram) */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}