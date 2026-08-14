import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex items-center h-11 w-full rounded-2xl border border-transparent bg-neutral-100/90 dark:bg-[#222222] text-neutral-900 dark:text-neutral-100 px-4 text-sm transition-all focus:bg-white dark:focus:bg-[#181818] focus:border-sky-500 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
