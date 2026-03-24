// app/dashboard/financeiro/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function DreCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b dark:border-zinc-800 last:border-0">
      <div className="space-y-1.5 flex-1 min-w-0">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full hidden sm:block shrink-0" />
      <div className="text-right shrink-0 space-y-1">
        <Skeleton className="h-5 w-24 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
      <div className="flex gap-1 shrink-0">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}

export default function FinanceiroLoading() {
  return (
    <>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <Skeleton className="h-9 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* Navegação de ciclo + botões */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
      </div>

      {/* Cards DRE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <DreCardSkeleton />
        <DreCardSkeleton />
        <DreCardSkeleton />
        <DreCardSkeleton />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Search + ações */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Skeleton className="h-10 flex-1" />
      </div>

      {/* Tabela de transações */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <Skeleton className="h-3 w-36 flex-1" />
          <Skeleton className="h-3 w-20 hidden sm:block" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <TransactionRowSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
