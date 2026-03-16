// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider"; // ADICIONADO AQUI

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard Oficina",
  description: "Sistema de gestão inteligente para oficinas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning é necessário para o next-themes funcionar sem erros no console
    <html lang="pt-BR" suppressHydrationWarning> 
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}