// app/dashboard/agendamentos/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function AppointmentRowSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 lg:items-center border-b dark:border-zinc-800/50 last:border-0">
      {/* Hora + Status */}
      <div className="flex items-center gap-4 lg:w-48 shrink-0">
        <Skeleton className="h-14 w-20 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      {/* Info cliente/carro */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      {/* Motivo */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Ações */}
      <div className="flex gap-2 shrink-0">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}

function DayGroupSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col border-b dark:border-zinc-800 last:border-0">
      {/* Header do dia */}
      <div className="px-4 py-2 border-y dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 flex items-center gap-2">
        <Skeleton className="h-3 w-48" />
      </div>
      {/* Linhas */}
      {Array.from({ length: rows }).map((_, i) => (
        <AppointmentRowSkeleton key={i} />
      ))}
    </div>
  );
}

export default function AgendamentosLoading() {
  return (
    <>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <Skeleton className="h-9 w-52 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Barra de filtros */}
        <div className="flex flex-col lg:flex-row items-center justify-between bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-3 shadow-sm gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <Skeleton className="h-8 w-14 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full lg:w-44 rounded-md" />
        </div>

        {/* Agenda */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex flex-col">
            <DayGroupSkeleton rows={3} />
            <DayGroupSkeleton rows={2} />
          </div>
        </div>
      </div>
    </>
  );
}
