import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils.ts";

/**
 * shadcn/ui Badge — README §9'a göre uyarlandı:
 * variant="outline" temel, dolgu yalnızca durum tint'i, radius 2px,
 * mono 10px uppercase. Yuvarlak köşe / gölge / ring yok (§1.8).
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-[7px] whitespace-nowrap border font-mono uppercase",
  {
    variants: {
      variant: {
        outline: "border-hairline bg-surface text-ink-mute",
        durum: "", // renkler çağıranın: border-*/bg-*-tint/text-*
      },
      boy: {
        sm: "px-[7px] py-[3px] text-[10px] tracking-[.1em]",
        md: "px-[9px] py-[5px] text-[10px] tracking-[.09em]",
      },
    },
    defaultVariants: { variant: "outline", boy: "sm" },
  },
);

function Badge({
  className,
  variant,
  boy,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant, boy }), className)} {...props} />;
}

export { Badge, badgeVariants };
