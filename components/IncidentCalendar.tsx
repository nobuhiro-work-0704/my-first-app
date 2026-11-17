"use client";

import { useMemo } from "react";
import { IncidentItem } from "@/lib/news";

interface Props {
  items: IncidentItem[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  currentMonth: "2026-10" | "2026-11";
  onMonthChange: (month: "2026-10" | "2026-11") => void;
}

export default function IncidentCalendar({
  items,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
}: Props) {
  const countByDate = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      map[item.pubDate] = (map[item.pubDate] || 0) + 1;
    });
    return map;
  }, [items]);

  const { year, month, daysInMonth, firstDayOfWeek } = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    const firstDay = date.getDay();
    const lastDate = new Date(y, m, 0).getDate();
    return {
      year: y,
      month: m,
      daysInMonth: lastDate,
      firstDayOfWeek: firstDay,
    };
  }, [currentMonth]);

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({
      day: d,
      dateStr,
      count: countByDate[dateStr] || 0,
    });
  }

  const weekHeaders = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6">
      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">
            {year}年 {month}月
          </span>

          <div className="inline-flex rounded border border-neutral-800 bg-neutral-950 p-0.5">
            <button
              onClick={() => onMonthChange("2026-10")}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                currentMonth === "2026-10"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              10月
            </button>
            <button
              onClick={() => onMonthChange("2026-11")}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                currentMonth === "2026-11"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              11月
            </button>
          </div>
        </div>

        {selectedDate && (
          <button
            onClick={() => onSelectDate(null)}
            className="text-neutral-400 hover:text-white font-medium flex items-center gap-1"
          >
            <span>✕</span>
            <span>{selectedDate} を解除</span>
          </button>
        )}
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-neutral-500 mb-1">
        {weekHeaders.map((w) => (
          <div key={w} className="py-0.5">
            {w}
          </div>
        ))}
      </div>

      {/* 日付セルグリッド */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((item, idx) => {
          if (!item) {
            return <div key={`empty-${idx}`} className="h-9 sm:h-10" />;
          }

          const hasIncidents = item.count > 0;
          const isSelected = selectedDate === item.dateStr;

          return (
            <button
              key={item.dateStr}
              onClick={() => onSelectDate(isSelected ? null : item.dateStr)}
              className={`h-9 sm:h-10 rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${
                isSelected
                  ? "bg-white text-neutral-950 font-bold"
                  : hasIncidents
                  ? "bg-neutral-800/80 hover:bg-neutral-700/80 text-white font-medium border border-neutral-700/50"
                  : "text-neutral-600 hover:text-neutral-400"
              }`}
            >
              <span>{item.day}</span>
              {hasIncidents && (
                <span
                  className={`text-[9px] font-bold leading-none mt-0.5 ${
                    isSelected ? "text-neutral-950" : "text-rose-400"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
