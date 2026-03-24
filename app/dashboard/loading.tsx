// app/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-3 w-36" />
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[220px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function ListCardSkeleton({ className, rows = 5 }: { className?: string; rows?: number }) {
  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="border-b dark:border-zinc-800 pb-4">
        <Skeleton className="h-5 w-48 mb-1" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent className="pt-4 flex-1 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between pb-4 border-b dark:border-zinc-800 last:border-0 last:pb-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-14 rounded-md shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
          <Skeleton className="h-9 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      {/* DashboardFilter placeholder */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 p-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm">
        <Skeleton className="h-9 w-full sm:w-64" />
        <Skeleton className="h-9 w-full sm:w-64" />
        <Skeleton className="h-9 w-full sm:w-28 sm:ml-auto" />
      </div>

      {/* 4 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <ChartCardSkeleton className="col-span-4" />
        <ChartCardSkeleton className="col-span-3" />
      </div>

      {/* Lists Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4 mb-8">
        <ListCardSkeleton className="col-span-4" rows={5} />
        <ListCardSkeleton className="col-span-3" rows={4} />
      </div>
    </>
  );
}
