import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string | number;
  onChange?: (e: { target: { value: any } }) => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  children,
  className,
  disabled,
  placeholder = '请选择',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse options from children (<option value="...">Label</option>)
  const options: SelectOption[] =
    React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const props = child.props as any;
        return {
          value: props.value,
          label: props.children,
          disabled: props.disabled,
        };
      }
      return null;
    })?.filter(Boolean) as SelectOption[] || [];

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optValue: string | number) => {
    if (disabled) return;
    onChange?.({ target: { value: optValue } });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border border-transparent bg-neutral-100/90 dark:bg-neutral-800/60 text-neutral-900 dark:text-neutral-100 px-3 py-1 text-sm transition-all focus:outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-400/20 dark:focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          className
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ml-1',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-auto rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1.5 text-sm shadow-xl animate-in fade-in-80">
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={String(opt.value)}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  isSelected && 'font-medium bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
                  opt.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-sky-500 shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
Select.displayName = 'Select';
