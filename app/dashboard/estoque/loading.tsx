// app/dashboard/estoque/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b dark:border-zinc-800 last:border-0">
      <Skeleton className="h-10 w-10 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-20 hidden sm:block" />
      <Skeleton className="h-4 w-16 hidden md:block" />
      <Skeleton className="h-5 w-14 rounded-full" />
      <div className="flex gap-1 ml-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}

export default function EstoqueLoading() {
  return (
    <>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <Skeleton className="h-9 w-52 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 hidden sm:block" />
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Tabs placeholder */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        {/* Search + controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Tabela */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16 hidden sm:block" />
            <Skeleton className="h-3 w-20 hidden md:block ml-auto" />
            <Skeleton className="h-3 w-12" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
