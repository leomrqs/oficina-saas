"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

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

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-sm duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

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
  const sizeClass = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
  }[size]

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 outline-none",
          // Mobile: full-width sheet from bottom, no side margins
          "left-0 right-0 bottom-0",
          "sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          // Sizing
          "w-full",
          sizeClass,
          // Height
          "max-h-[95dvh] sm:max-h-[90vh]",
          // Shape
          "rounded-t-3xl sm:rounded-2xl",
          // Color
          "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100",
          "ring-1 ring-zinc-200/80 dark:ring-zinc-800",
          "shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:shadow-2xl dark:shadow-[0_-8px_40px_rgba(0,0,0,0.4)]",
          // Animation — mobile slides up from bottom, desktop zooms in
          "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "data-open:animate-in data-closed:animate-out",
          "data-open:slide-in-from-bottom-full data-closed:slide-out-to-bottom-full",
          "sm:data-open:slide-in-from-bottom-0 sm:data-closed:slide-out-to-bottom-0",
          "sm:data-open:fade-in-0 sm:data-open:zoom-in-[0.97]",
          "sm:data-closed:fade-out-0 sm:data-closed:zoom-out-[0.97]",
          // Layout — flex col so header/body/footer stack and body scrolls
          "flex flex-col overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex-none flex justify-center pt-3 pb-1" aria-hidden>
          <div className="w-10 h-[5px] rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>

        {children}

        {/* Close button */}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 z-20 flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all duration-150 ring-1 ring-zinc-200 dark:ring-zinc-700"
          >
            <XIcon className="w-4 h-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

type DialogHeaderProps =
  | {
      icon?: React.ReactNode
      iconClass?: string
      title: string
      description?: string
      className?: string
      children?: never
    }
  | (React.ComponentProps<"div"> & {
      icon?: never
      iconClass?: never
      title?: never
      description?: never
    })

function DialogHeader(props: DialogHeaderProps) {
  // Premium header: when title prop is provided
  if (typeof props.title === "string") {
    const { icon, iconClass, title, description, className } = props
    return (
      <div data-slot="dialog-header" className={cn("relative shrink-0 overflow-hidden", className)}>
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />
        <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          {icon && (
            <div className={cn("p-2.5 rounded-xl shadow-lg shrink-0", iconClass ?? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-600/30 dark:shadow-blue-600/15")}>
              {icon}
            </div>
          )}
          <div className="min-w-0 pr-8">
            <h3 className="font-black text-lg text-zinc-900 dark:text-white leading-tight truncate">{title}</h3>
            {description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{description}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Legacy header: simple div wrapper with children
  const { className, ...rest } = props
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 px-5 sm:px-6 pt-5 pb-3", className)}
      {...rest}
    />
  )
}

function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain",
        "px-4 sm:px-6 py-4 sm:py-5",
        // Smooth scrolling on iOS
        "-webkit-overflow-scrolling-touch",
        className
      )}
    >
      {children}
    </div>
  )
}

function DialogFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2",
        "px-4 sm:px-6 py-4",
        // Safe area for iPhone home bar
        "pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4",
        "border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
