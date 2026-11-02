import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-foreground backdrop-blur-md transition-all outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
