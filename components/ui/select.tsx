"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1.5", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left truncate", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // Base
        "group/trigger flex w-full items-center justify-between gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none cursor-pointer",
        // Border & bg
        "border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900",
        "hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50",
        // Focus
        "focus-visible:border-blue-400 dark:focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/15 dark:focus-visible:ring-blue-500/20",
        // Shadow
        "shadow-sm hover:shadow-md dark:shadow-zinc-950/30",
        // Sizing
        "data-[size=default]:h-10 data-[size=default]:px-3.5 data-[size=default]:py-2.5",
        "data-[size=sm]:h-8 data-[size=sm]:px-2.5 data-[size=sm]:py-1.5 data-[size=sm]:text-xs data-[size=sm]:rounded-lg",
        // Placeholder text
        "data-placeholder:text-zinc-400 dark:data-placeholder:text-zinc-500",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        // Value truncation
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="size-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-data-[popup-open]/trigger:rotate-180" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-[100]"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            // Base
            "relative isolate z-[100] max-h-(--available-height) w-(--anchor-width) min-w-44 origin-(--transform-origin) overflow-x-hidden overflow-y-auto",
            // Shape & color
            "rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
            // Border & shadow
            "ring-1 ring-zinc-200 dark:ring-zinc-700/80",
            "shadow-xl shadow-zinc-900/10 dark:shadow-zinc-950/40",
            // Padding
            "p-1.5",
            // Animation
            "data-[align-trigger=true]:animate-none",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97]",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97]",
            "duration-150",
            className
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-2.5 py-2 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Base
        "relative flex w-full cursor-pointer items-center gap-2 rounded-lg py-2.5 pr-9 pl-3 text-sm font-medium outline-hidden select-none transition-all duration-100",
        // Hover / Focus
        "focus:bg-blue-50 dark:focus:bg-blue-500/10 focus:text-blue-700 dark:focus:text-blue-300",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
        // Selected
        "data-selected:bg-blue-50 dark:data-selected:bg-blue-500/10 data-selected:text-blue-700 dark:data-selected:text-blue-300 data-selected:font-semibold",
        // Disabled
        "data-disabled:pointer-events-none data-disabled:opacity-40",
        // Icons
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2.5 flex size-5 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-500/20" />
        }
      >
        <CheckIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1.5 h-px bg-zinc-100 dark:bg-zinc-800", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-white dark:bg-zinc-900 py-1.5 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="text-zinc-400" />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-white dark:bg-zinc-900 py-1.5 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="text-zinc-400" />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
