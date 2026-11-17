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
  // 日付ごとの件数マップを作成 { "2026-11-17": 3, "2026-10-22": 2, ... }
  const countByDate = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      map[item.pubDate] = (map[item.pubDate] || 0) + 1;
    });
    return map;
  }, [items]);

  // カレンダーの日付グリッドを生成
  const { year, month, daysInMonth, firstDayOfWeek } = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    const firstDay = date.getDay(); // 0 = 日曜
    const lastDate = new Date(y, m, 0).getDate(); // 月の末日 (31など)
    return {
      year: y,
      month: m,
      daysInMonth: lastDate,
      firstDayOfWeek: firstDay,
    };
  }, [currentMonth]);

  const days = [];
  // 月初前の空マス
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  // 1日〜末日
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl mb-8">
      {/* カレンダーヘッダー（年月切り替え & クリア） */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-white flex items-center gap-1.5">
            <span>📅</span>
            <span>{year}年 {month}月</span>
          </span>

          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => onMonthChange("2026-10")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                currentMonth === "2026-10"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              10月
            </button>
            <button
              onClick={() => onMonthChange("2026-11")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                currentMonth === "2026-11"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              11月
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedDate && (
            <button
              onClick={() => onSelectDate(null)}
              className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold hover:bg-rose-500/30 transition-all flex items-center gap-1"
            >
              <span>✕</span>
              <span>{selectedDate} の絞り込みを解除</span>
            </button>
          )}
          <span className="text-xs text-slate-500 hidden sm:inline">
            ※ 数字バッジは公表件数
          </span>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
        {weekHeaders.map((w, idx) => (
          <div
            key={w}
            className={`py-1 ${
              idx === 0 ? "text-rose-400/80" : idx === 6 ? "text-indigo-400/80" : ""
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日付セルグリッド */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {days.map((item, idx) => {
          if (!item) {
            return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
          }

          const hasIncidents = item.count > 0;
          const isSelected = selectedDate === item.dateStr;

          return (
            <button
              key={item.dateStr}
              onClick={() => {
                if (isSelected) {
                  onSelectDate(null); // 同じ日をクリックでトグル解除
                } else if (hasIncidents) {
                  onSelectDate(item.dateStr);
                } else {
                  onSelectDate(item.dateStr); // 件数0でも選択可能
                }
              }}
              className={`relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? "bg-rose-600 text-white font-bold ring-2 ring-rose-400 shadow-lg shadow-rose-600/30"
                  : hasIncidents
                  ? "bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold border border-slate-700/80 hover:scale-105"
                  : "bg-slate-950/40 text-slate-500 hover:bg-slate-900/60"
              }`}
            >
              <span className="text-xs sm:text-sm">{item.day}</span>
              {hasIncidents && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                    isSelected
                      ? "bg-white text-rose-600"
                      : "bg-rose-500 text-white shadow-xs"
                  }`}
                >
                  {item.count}件
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
