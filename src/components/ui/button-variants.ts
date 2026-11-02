import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent font-medium whitespace-nowrap transition-all duration-150 outline-none select-none cursor-pointer active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-semibold hover:brightness-110 active:brightness-95 [a]:hover:brightness-110",
        outline:
          "border-white/15 bg-white/5 hover:bg-white/10 text-foreground backdrop-blur-md active:bg-white/15",
        secondary:
          "border-white/10 bg-white/10 text-white hover:bg-white/15 backdrop-blur-md active:bg-white/20",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-white/10 active:bg-white/15",
        destructive:
          "border-red-500/30 bg-red-500/20 text-red-300 hover:bg-red-500/30 active:bg-red-500/40",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-9 gap-2 px-3.5 text-sm",
        xs: "h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 rounded-lg px-5 text-base",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
