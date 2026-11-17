"use client";

import { useState, useMemo } from "react";
import { IncidentItem } from "@/lib/news";
import IncidentCalendar from "./IncidentCalendar";

interface Props {
  initialItems: IncidentItem[];
  updatedAt: string;
}

export default function IncidentDashboard({ initialItems, updatedAt }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedAttackType, setSelectedAttackType] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<"2026-10" | "2026-11">("2026-11");
  const [showCalendar, setShowCalendar] = useState(false); // 初期状態はすっきり折りたたみ
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 検索とフィルター処理
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.affectedCompany?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetSystem?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.vulnerabilityDetails && item.vulnerabilityDetails.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.impact.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        selectedSeverity === "ALL" || item.severity === selectedSeverity;

      const matchesAttackType =
        selectedAttackType === "ALL" || item.attackType === selectedAttackType;

      const matchesDate =
        selectedDate === null || item.pubDate === selectedDate;

      return matchesSearch && matchesSeverity && matchesAttackType && matchesDate;
    });
  }, [initialItems, searchQuery, selectedSeverity, selectedAttackType, selectedDate]);

  // 統計情報
  const stats = useMemo(() => {
    const total = initialItems.length;
    const highCount = initialItems.filter((i) => i.severity === "HIGH").length;
    const vulnExploitCount = initialItems.filter((i) => i.attackType === "脆弱性悪用").length;
    const takeoverCount = initialItems.filter((i) => i.attackType === "アカウント乗っ取り").length;
    return { total, highCount, vulnExploitCount, takeoverCount };
  }, [initialItems]);

  // Slack / テキスト共有用コピー
  const handleCopy = (item: IncidentItem) => {
    const text = `【セキュリティ速報】
公表企業: ${item.affectedCompany}
侵害対象: ${item.targetSystem} (${item.incidentOrigin})
攻撃手法: ${item.attackType}${item.vulnerabilityDetails ? ` (${item.vulnerabilityDetails})` : ""}
公表日: ${item.dateDisplay}
深刻度: ${item.severity}
タイトル: ${item.title}
概要: ${item.summary}
影響範囲: ${item.impact}
推奨対応: ${item.action}
公式URL: ${item.link}`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div>
      {/* 統計ミニバー（モノトーン＋赤1色の落ち着いた数値表示） */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 text-xs">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
          <span className="text-neutral-500 block mb-0.5">収集件数（10/1〜）</span>
          <span className="text-xl font-bold text-white">{stats.total} <span className="text-xs font-normal text-neutral-500">件</span></span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
          <span className="text-neutral-500 block mb-0.5">要警戒 (HIGH)</span>
          <span className="text-xl font-bold text-rose-400">{stats.highCount} <span className="text-xs font-normal text-neutral-500">件</span></span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
          <span className="text-neutral-500 block mb-0.5">脆弱性悪用</span>
          <span className="text-xl font-bold text-white">{stats.vulnExploitCount} <span className="text-xs font-normal text-neutral-500">件</span></span>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
          <span className="text-neutral-500 block mb-0.5">アカウント乗っ取り</span>
          <span className="text-xl font-bold text-white">{stats.takeoverCount} <span className="text-xs font-normal text-neutral-500">件</span></span>
        </div>
      </div>

      {/* 検索入力窓 */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="企業名、SaaS名、脆弱性名、キーワードで検索..."
            className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-neutral-400 hover:text-white"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* フィルター＆カレンダー操作バー */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-800/80 text-xs">
        {/* 攻撃手法タブ */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "すべて" },
            { id: "脆弱性悪用", label: `脆弱性悪用 (${stats.vulnExploitCount})` },
            { id: "アカウント乗っ取り", label: `アカウント乗っ取り (${stats.takeoverCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedAttackType(tab.id)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedAttackType === tab.id
                  ? "bg-white text-neutral-950 font-semibold"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* カレンダートグル & 絞り込み状態 */}
        <div className="flex items-center gap-2">
          {selectedDate && (
            <span className="text-rose-400 font-medium flex items-center gap-1">
              <span>{selectedDate}</span>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-neutral-500 hover:text-white"
              >
                (解除)
              </button>
            </span>
          )}

          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            {showCalendar ? "カレンダーを隠す" : "📅 カレンダー表示"}
          </button>
        </div>
      </div>

      {/* カレンダー（トグル開閉） */}
      {showCalendar && (
        <IncidentCalendar
          items={initialItems}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}

      {/* インシデント一覧 */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-xs border border-dashed border-neutral-800 rounded-lg">
            条件に一致するインシデントは見つかりませんでした
          </div>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors"
            >
              {/* メタ情報行（企業、SaaS、攻撃手法、深刻度、日付） */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">
                    {item.affectedCompany}
                  </span>

                  <span className="text-neutral-600">|</span>

                  <span className="text-neutral-300">
                    対象: {item.targetSystem}
                  </span>

                  <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[11px]">
                    {item.attackType}
                  </span>

                  {item.severity === "HIGH" && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold text-[11px]">
                      HIGH
                    </span>
                  )}
                </div>

                <span className="font-mono text-neutral-500 text-[11px]">
                  {item.pubDate}
                </span>
              </div>

              {/* 発表タイトル */}
              <h2 className="text-sm sm:text-base font-semibold text-white hover:text-neutral-300 transition-colors mb-3 leading-snug">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </h2>

              {/* 悪用された脆弱性（存在する場合のみ、シンプル表示） */}
              {item.vulnerabilityDetails && (
                <div className="mb-3 px-3 py-1.5 rounded bg-neutral-950 border border-neutral-800 text-xs flex items-center gap-2">
                  <span className="text-neutral-500">悪用脆弱性:</span>
                  <span className="font-mono text-neutral-200">{item.vulnerabilityDetails}</span>
                </div>
              )}

              {/* AI要約 & 影響・対応 */}
              <div className="bg-neutral-950 rounded-lg p-3.5 space-y-2 mb-3.5 text-xs">
                <p className="text-neutral-300 leading-relaxed">
                  {item.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-800/60 text-neutral-400">
                  <div>
                    <span className="text-neutral-500 mr-1.5">影響:</span>
                    <span className="text-neutral-300">{item.impact}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 mr-1.5">対応:</span>
                    <span className="text-neutral-300">{item.action}</span>
                  </div>
                </div>
              </div>

              {/* フッターアクション */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  onClick={() => handleCopy(item)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  {copiedId === item.id ? "✓ コピー完了" : "📋 要約をコピー"}
                </button>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>公式発表を開く</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
