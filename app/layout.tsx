// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Importando a fonte Premium de SaaS
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Configurando a fonte
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", // Criando a variável para o Tailwind
});

export const metadata: Metadata = {
  title: "Oficina SaaS",
  description: "Gestão inteligente para sua oficina mecânica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body 
        className={`${inter.className} ${inter.variable} antialiased min-h-screen bg-zinc-50 text-zinc-900`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}