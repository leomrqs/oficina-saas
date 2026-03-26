"use client";
// app/dashboard/TenantStatusToggle.tsx
import { useState } from "react";
import { toggleTenantStatus } from "@/actions/saas";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Ban } from "lucide-react";

export function TenantStatusToggle({
  tenantId,
  isActive,
}: {
  tenantId: string;
  isActive: boolean;
}) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleTenantStatus(tenantId, !active);
      setActive((prev) => !prev);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={
        active
          ? "text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-7 px-2"
          : "text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 h-7 px-2"
      }
    >
      {active ? (
        <><Ban className="w-3.5 h-3.5 mr-1" />Bloquear</>
      ) : (
        <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Ativar</>
      )}
    </Button>
  );
}
