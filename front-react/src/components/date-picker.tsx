import React from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  mode?: 'single' | 'range';
  value?: Date | DateRange | { start: Date; end: Date };
  onChange?: (date: any) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  mode = 'single',
  value,
  onChange,
}) => {
  if (mode === 'range') {
    let selectedRange: DateRange | undefined;
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('start' in value && 'end' in value) {
        selectedRange = { from: value.start, to: value.end };
      } else {
        selectedRange = value as DateRange;
      }
    }

    return (
      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={onChange}
        className="border rounded-md p-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
      />
    );
  }

  return (
    <DayPicker
      mode="single"
      selected={value instanceof Date ? value : undefined}
      onSelect={onChange}
      className="border rounded-md p-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
    />
  );
};
