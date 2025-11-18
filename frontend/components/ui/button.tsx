import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive font-press-start tracking-wider",
  {
    variants: {
      variant: {
        default:
          'pixel-button bg-[#4A8C4A] text-white border-2 border-[#4A8C4A] hover:bg-[#4A8C4A]/80 hover:border-[#4A8C4A]/80 text-xs',
        destructive:
          'pixel-button bg-[#8B0000] text-white border-2 border-[#8B0000] hover:bg-[#8B0000]/80 hover:border-[#8B0000]/80 text-xs',
        outline:
          'pixel-button bg-transparent text-[#4A8C4A] border-2 border-[#4A8C4A] hover:bg-[#4A8C4A]/20 text-xs',
        secondary:
          'pixel-button bg-[#1a1a1a] text-white border-2 border-[#2a2a2a] hover:bg-[#2a2a2a] text-xs',
        ghost:
          'pixel-button bg-transparent text-[#4A8C4A] border-2 border-transparent hover:border-[#4A8C4A] hover:bg-[#4A8C4A]/10 text-xs',
        link: 'text-[#4A8C4A] underline-offset-4 hover:underline text-xs',
        // Enhanced pixel art variants with Pepe-themed color scheme
        pixel:
          'pixel-button bg-[#4A8C4A] text-white border-2 border-[#4A8C4A] hover:bg-[#4A8C4A]/80 hover:border-[#4A8C4A]/80 text-xs tracking-widest',
        pixelRed:
          'pixel-button bg-[#8B0000] text-white border-2 border-[#8B0000] hover:bg-[#8B0000]/80 hover:border-[#8B0000]/80 text-xs tracking-widest',
        pixelPurple:
          'pixel-button bg-[#A259FF] text-white border-2 border-[#A259FF] hover:bg-[#A259FF]/80 hover:border-[#A259FF]/80 text-xs tracking-widest',
        pixelYellow:
          'pixel-button bg-[#CCCC00] text-black border-2 border-[#CCCC00] hover:bg-[#CCCC00]/80 hover:border-[#CCCC00]/80 text-xs tracking-widest',
        pixelOutline:
          'pixel-button bg-transparent text-[#4A8C4A] border-2 border-[#4A8C4A] hover:bg-[#4A8C4A]/20 text-xs tracking-widest',
        pixelDark:
          'pixel-button bg-[#1a1a1a] text-[#4A8C4A] border-2 border-[#4A8C4A] hover:bg-[#2a2a2a] hover:border-[#4A8C4A]/80 text-xs tracking-widest',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3 rounded-none',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5 rounded-none',
        lg: 'h-10 px-6 has-[>svg]:px-4 rounded-none',
        icon: 'size-9 rounded-none',
        // Pixel art sizes
        pixel: 'h-10 px-4 py-2 rounded-none text-xs',
        pixelLarge: 'h-12 px-6 py-3 rounded-none text-sm',
        pixelXl: 'h-14 px-8 py-4 rounded-none text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }