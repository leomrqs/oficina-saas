// app/dashboard/faturamento/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

function BillingRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-md shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="px-4 py-3.5 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
      <td className="px-4 py-3.5 text-center"><Skeleton className="h-8 w-8 rounded-full mx-auto" /></td>
      <td className="px-4 py-3.5 text-center hidden sm:table-cell"><Skeleton className="h-3 w-12 mx-auto" /></td>
      <td className="px-4 py-3.5 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></td>
    </tr>
  );
}

export default function FaturamentoLoading() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-9 w-52 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-40 hidden sm:block" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-zinc-800">
          <Skeleton className="h-5 w-40 mb-1.5" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <th key={i} className="px-4 py-3">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <BillingRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
