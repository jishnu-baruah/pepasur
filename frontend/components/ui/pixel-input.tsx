import * as React from 'react'
import { cn } from '@/lib/utils'

export interface PixelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PixelInput = React.forwardRef<HTMLInputElement, PixelInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-none border-2 border-[#4A8C4A] bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8C4A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-press-start pixel-text",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
PixelInput.displayName = "PixelInput"

export { PixelInput }
