"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

/* ── primitives ─────────────────────────────────────────────────────────────── */

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}
function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}
function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}
function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0 duration-200",
        className
      )}
      {...props}
    />
  )
}

/* ── DialogContent ─────────────────────────────────────────────────────────────
   Mobile (<640px) : full-width bottom sheet, slides up
   Desktop (≥640px): centered popup, zooms in
──────────────────────────────────────────────────────────────────────────────── */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "md",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const maxW = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size]

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 outline-none flex flex-col",
          "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100",

          /* ── MOBILE ONLY (< 640px): floating card, 12px from edges/bottom ── */
          "max-sm:left-3 max-sm:right-3 max-sm:bottom-3",
          "max-sm:w-auto max-sm:max-h-[88vh]",
          "max-sm:rounded-2xl max-sm:shadow-2xl max-sm:shadow-black/30",

          /* ── DESKTOP (≥ 640px): centered popup ── */
          "sm:left-1/2 sm:top-1/2",
          "sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:w-[calc(100%-2rem)]", maxW,
          "sm:max-h-[90vh]",
          "sm:rounded-2xl",
          "sm:shadow-2xl sm:ring-1 sm:ring-zinc-200 sm:dark:ring-zinc-800",

          /* ── animation — fade+zoom only (no translate to avoid centering conflict) ── */
          "duration-200",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97]",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97]",

          className
        )}
        {...props}
      >

        {children}

        {/* close button */}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-3 right-3 z-20 sm:top-4 sm:right-4 flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            <XIcon className="w-4 h-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

/* ── DialogHeader ──────────────────────────────────────────────────────────────
   Premium: pass { title, icon?, iconClass?, description? }
   Legacy:  pass children (plain div wrapper)
──────────────────────────────────────────────────────────────────────────────── */
type DialogHeaderProps =
  | { icon?: React.ReactNode; iconClass?: string; title: string; description?: string; className?: string; children?: never }
  | (React.ComponentProps<"div"> & { icon?: never; iconClass?: never; title?: never; description?: never })

function DialogHeader(props: DialogHeaderProps) {
  if (typeof props.title === "string") {
    const { icon, iconClass, title, description, className } = props
    return (
      <div data-slot="dialog-header" className={cn("relative shrink-0", className)}>
        {/* accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 pointer-events-none rounded-t-xl" />
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          {icon && (
            <div className={cn("shrink-0 w-10 h-10 flex items-center justify-center rounded-xl shadow-md", iconClass ?? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-600/30")}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0 pr-8">
            <p className="font-black text-[17px] leading-snug text-zinc-900 dark:text-white truncate">{title}</p>
            {description && <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{description}</p>}
          </div>
        </div>
      </div>
    )
  }
  const { className, ...rest } = props
  return (
    <div data-slot="dialog-header" className={cn("shrink-0 flex flex-col gap-1.5 px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800", className)} {...rest} />
  )
}

/* ── DialogBody ─────────────────────────────────────────────────────────────── */
function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4", className)}
    >
      {children}
    </div>
  )
}

/* ── DialogFooter ─────────────────────────────────────────────────────────────
   Always flex-row so buttons never stack (prevents cut-off on mobile)
──────────────────────────────────────────────────────────────────────────────── */
function DialogFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "shrink-0 flex flex-row items-center gap-2 px-4 pt-3",
        /* safe area bottom inset (iPhone home bar) */
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ── legacy ─────────────────────────────────────────────────────────────────── */
function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-base leading-none font-semibold", className)} {...props} />
}
function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export {
  Dialog, DialogBody, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger,
}
