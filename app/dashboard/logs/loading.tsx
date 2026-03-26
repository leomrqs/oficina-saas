// app/dashboard/logs/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function LogsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-52 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-zinc-800">
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-7 w-7 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-3 w-20 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
