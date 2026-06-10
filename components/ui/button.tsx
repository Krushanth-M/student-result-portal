import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-xs tracking-wider uppercase transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          variant === "default" && "bg-[#ff9e00] text-black hover:bg-amber-600 font-semibold",
          variant === "outline" && "border border-amber-500/20 bg-transparent text-[#ff9e00] hover:border-cyber-amber/50 hover:bg-cyber-amber/5",
          variant === "ghost" && "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100",
          size === "default" && "h-9 px-4 py-2",
          size === "sm" && "h-8 rounded px-3 text-[10px]",
          size === "lg" && "h-11 rounded px-8",
          size === "icon" && "h-9 w-9",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
