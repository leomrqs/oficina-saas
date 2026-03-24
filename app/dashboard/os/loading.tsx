// app/dashboard/os/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b dark:border-zinc-800 last:border-0 gap-4">
      <div className="space-y-2 min-w-[100px]">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <div className="space-y-2 flex-1 max-w-[220px]">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-40 hidden md:block" />
      <div className="space-y-1 text-right min-w-[80px]">
        <Skeleton className="h-6 w-20 ml-auto" />
        <Skeleton className="h-4 w-16 ml-auto rounded-full" />
      </div>
      <div className="flex gap-1 shrink-0">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}

export default function OSLoading() {
  return (
    <>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <Skeleton className="h-9 w-52 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* Barra de filtros + botão */}
      <div className="flex flex-col xl:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          <Skeleton className="h-10 w-full xl:max-w-md" />
          <Skeleton className="h-10 w-full sm:w-[220px]" />
          <Skeleton className="h-10 w-full sm:w-[170px]" />
        </div>
        <Skeleton className="h-10 w-full xl:w-40" />
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-36 hidden md:block flex-1" />
          <Skeleton className="h-3 w-20 ml-auto" />
          <Skeleton className="h-3 w-16" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
