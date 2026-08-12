import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  mode?: 'single' | 'range';
  value?: Date | { start?: Date; end?: Date } | any;
  onChange?: (date: any) => void;
  showTime?: boolean;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const DatePicker: React.FC<DatePickerProps> = ({
  mode = 'single',
  value,
  onChange,
  showTime = true,
}) => {
  // Determine current view month & year
  const getInitialDate = () => {
    if (value instanceof Date) return value;
    if (value?.start instanceof Date) return value.start;
    if (value?.from instanceof Date) return value.from;
    return new Date();
  };

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = getInitialDate();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    const d = getInitialDate();
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [value]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Calendar calculations
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Create grid cells
  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Trailing days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Leading days of next month to fill grid
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const isSameDay = (d1: Date | undefined | null, d2: Date | undefined | null) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isToday = (d: Date) => isSameDay(d, new Date());

  const handleDateClick = (d: Date) => {
    if (mode === 'single') {
      const newDate = new Date(d);
      if (value instanceof Date) {
        newDate.setHours(value.getHours());
        newDate.setMinutes(value.getMinutes());
      } else {
        const now = new Date();
        newDate.setHours(now.getHours());
        newDate.setMinutes(now.getMinutes());
      }
      onChange?.(newDate);
    } else if (mode === 'range') {
      const rangeStart = value?.start || value?.from;
      const rangeEnd = value?.end || value?.to;

      if (!rangeStart || (rangeStart && rangeEnd)) {
        onChange?.({ from: d, to: null });
      } else if (rangeStart && !rangeEnd) {
        if (d < rangeStart) {
          onChange?.({ from: d, to: rangeStart });
        } else {
          onChange?.({ from: rangeStart, to: d });
        }
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!(value instanceof Date) || !onChange) return;
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(value);
    newDate.setHours(hours || 0);
    newDate.setMinutes(minutes || 0);
    onChange(newDate);
  };

  const timeString =
    value instanceof Date
      ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
      : '12:00';

  return (
    <div className="w-full max-w-[320px] mx-auto p-1 flex flex-col select-none">
      {/* 头部：年份月份 + 翻页按钮 */}
      <div className="flex items-center justify-between pb-3 px-1">
        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
          {year}年 {month + 1}月
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 mb-1 text-center">
        {WEEKDAYS.map((wd) => (
          <span key={wd} className="text-[0.75rem] font-medium text-neutral-400 dark:text-neutral-500 py-1">
            {wd}
          </span>
        ))}
      </div>

      {/* 日期网格 7列 */}
      <div className="grid grid-cols-7 gap-y-1 justify-items-center">
        {days.map(({ date, isCurrentMonth }, idx) => {
          const singleSelected = value instanceof Date && isSameDay(date, value);
          const rangeStart = value?.start || value?.from;
          const rangeEnd = value?.end || value?.to;

          const inRangeStart = mode === 'range' && isSameDay(date, rangeStart);
          const inRangeEnd = mode === 'range' && isSameDay(date, rangeEnd);
          const inRangeMiddle =
            mode === 'range' &&
            rangeStart &&
            rangeEnd &&
            date > rangeStart &&
            date < rangeEnd;

          const isCurrentToday = isToday(date);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDateClick(date)}
              className={cn(
                'w-8 h-8 text-xs rounded-full flex items-center justify-center transition-all cursor-pointer',
                !isCurrentMonth && 'text-neutral-300 dark:text-neutral-600',
                isCurrentMonth && !singleSelected && !inRangeStart && !inRangeEnd && 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                isCurrentToday && !singleSelected && !inRangeStart && !inRangeEnd && 'border border-sky-500 font-bold text-sky-600 dark:text-sky-400',
                (singleSelected || inRangeStart || inRangeEnd) && 'bg-sky-500 text-white font-medium shadow-sm hover:bg-sky-600',
                inRangeMiddle && 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-none w-full'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* 底部时间微调选择框（单选模式） */}
      {mode === 'single' && showTime && value instanceof Date && (
        <div className="w-full pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-1">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">具体时间</span>
          <input
            type="time"
            value={timeString}
            onChange={handleTimeChange}
            className="text-xs h-8 px-2.5 border border-transparent rounded-xl bg-neutral-100/90 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 outline-none focus:bg-white dark:focus:bg-neutral-900 focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-400/20 dark:focus:ring-sky-500/20 cursor-pointer transition-all font-medium"
          />
        </div>
      )}
    </div>
  );
};
