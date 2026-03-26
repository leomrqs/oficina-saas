// app/dashboard/oficinas/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function TenantRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b dark:border-zinc-800 last:border-0">
      <Skeleton className="h-9 w-9 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-28 hidden md:block" />
      <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-4 w-20 hidden md:block" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  );
}

export default function OficinasLoading() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-9 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 hidden sm:block" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Skeleton className="h-10 flex-1" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <Skeleton className="h-3 w-24 flex-1" />
          <Skeleton className="h-3 w-20 hidden md:block" />
          <Skeleton className="h-3 w-16 hidden sm:block" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <TenantRowSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
