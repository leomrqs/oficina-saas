// app/dashboard/loading.tsx
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" />
      <p className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">
        Carregando informações da oficina...
      </p>
    </div>
  );
}