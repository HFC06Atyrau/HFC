import * as React from "react"
import { cn } from "@/lib/utils"

export interface MobileOptimizedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  mobileType?: 'text' | 'number' | 'tel' | 'email' | 'url';
}

/**
 * Оптимизированный Input для мобильных устройств
 * - Правильные атрибуты для мобильной клавиатуры
 * - Отключение автозаполнения где не нужно
 * - Правильный inputMode для числовых полей
 */
const MobileOptimizedInput = React.forwardRef<HTMLInputElement, MobileOptimizedInputProps>(
  ({ className, type, mobileType, ...props }, ref) => {
    const getInputMode = () => {
      if (props.inputMode) return props.inputMode;
      if (type === 'number' || mobileType === 'number') return 'numeric';
      if (mobileType === 'tel') return 'tel';
      if (mobileType === 'email') return 'email';
      if (mobileType === 'url') return 'url';
      return 'text';
    };

    const mobileOptimizations = {
      autoCorrect: props.autoCorrect ?? 'off',
      autoCapitalize: props.autoCapitalize ?? 'off',
      inputMode: getInputMode(),
      ...(type === 'number' && {
        pattern: '[0-9]*',
      }),
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm text-base",
          className
        )}
        ref={ref}
        {...mobileOptimizations}
        {...props}
      />
    )
  }
)
MobileOptimizedInput.displayName = "MobileOptimizedInput"

export { MobileOptimizedInput }
