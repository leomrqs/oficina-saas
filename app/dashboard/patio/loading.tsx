// app/dashboard/patio/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function KanbanCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border dark:border-zinc-800 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
      <div className="flex justify-between items-center border-t dark:border-zinc-800 pt-3 mt-1">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

function KanbanColumnSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="flex flex-col flex-1 min-w-[280px] xl:min-w-0 shrink-0 bg-zinc-50 dark:bg-zinc-900/50 border dark:border-zinc-800/80 rounded-xl max-h-[calc(100vh-210px)]">
      {/* Column header */}
      <div className="p-3 border-b dark:border-zinc-800 rounded-t-xl flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-5 w-6 rounded-full" />
      </div>
      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {Array.from({ length: cards }).map((_, i) => (
          <KanbanCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function PatioLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <Skeleton className="h-9 w-44 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="flex flex-col h-full gap-4">
        {/* Barra de filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 bg-white dark:bg-zinc-900 p-3 rounded-lg border dark:border-zinc-800 shadow-sm">
          <Skeleton className="h-9 w-full sm:max-w-md" />
          <Skeleton className="h-9 w-full sm:w-64" />
        </div>

        {/* Colunas do Kanban */}
        <div className="flex flex-1 gap-3 xl:gap-4 items-start overflow-x-auto pb-6">
          <KanbanColumnSkeleton cards={3} />
          <KanbanColumnSkeleton cards={2} />
          <KanbanColumnSkeleton cards={2} />
          <KanbanColumnSkeleton cards={1} />
          <KanbanColumnSkeleton cards={2} />
        </div>
      </div>
    </div>
  );
}
