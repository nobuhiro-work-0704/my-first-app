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
  const [selectedOrigin, setSelectedOrigin] = useState<string>("ALL");
  const [selectedAttackType, setSelectedAttackType] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<"2026-10" | "2026-11">("2026-11");
  const [showCalendar, setShowCalendar] = useState(true);
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

      const matchesOrigin =
        selectedOrigin === "ALL" || item.incidentOrigin === selectedOrigin;

      const matchesAttackType =
        selectedAttackType === "ALL" || item.attackType === selectedAttackType;

      const matchesDate =
        selectedDate === null || item.pubDate === selectedDate;

      return matchesSearch && matchesSeverity && matchesOrigin && matchesAttackType && matchesDate;
    });
  }, [initialItems, searchQuery, selectedSeverity, selectedOrigin, selectedAttackType, selectedDate]);

  // 統計情報
  const stats = useMemo(() => {
    const total = initialItems.length;
    const vulnExploitCount = initialItems.filter((i) => i.attackType === "脆弱性悪用").length;
    const takeoverCount = initialItems.filter((i) => i.attackType === "アカウント乗っ取り").length;
    const saasOriginCount = initialItems.filter((i) => i.incidentOrigin.includes("SaaS") || i.incidentOrigin.includes("委託先")).length;
    return { total, vulnExploitCount, takeoverCount, saasOriginCount };
  }, [initialItems]);

  // Slack / テキスト共有用コピー
  const handleCopy = (item: IncidentItem) => {
    const text = `【⚠️セキュリティ速報】
🏢 公表企業: ${item.affectedCompany}
⚡ 侵害元SaaS・システム: ${item.targetSystem} (${item.incidentOrigin})
🎯 攻撃手法: ${item.attackType}${item.vulnerabilityDetails ? `\n🔍 悪用脆弱性: ${item.vulnerabilityDetails}` : ""}
📅 公表日: ${item.dateDisplay}
深刻度: ${item.severity} (${item.category})
タイトル: ${item.title}
概要: ${item.summary}
影響範囲: ${item.impact}
推奨対応: ${item.action}
公式URL: ${item.link}`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // X (Twitter) でシェア
  const handleShareX = (item: IncidentItem) => {
    const shareText = `【セキュリティ速報】${item.affectedCompany}（${item.targetSystem}）\n手法: ${item.attackType}${item.vulnerabilityDetails ? ` / 脆弱性: ${item.vulnerabilityDetails}` : ""}\n`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(item.link)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      {/* 統計ミニカウンターバー */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur-sm">
          <span className="text-slate-400 text-xs block mb-1">10/1以降の一次発表</span>
          <span className="text-2xl font-bold text-white">{stats.total} <span className="text-xs text-slate-500 font-normal">件</span></span>
        </div>
        <div className="bg-purple-950/30 border border-purple-900/40 rounded-xl p-3.5 backdrop-blur-sm">
          <span className="text-purple-400 text-xs block mb-1">⚡ 脆弱性悪用</span>
          <span className="text-2xl font-bold text-purple-400">{stats.vulnExploitCount} <span className="text-xs text-purple-500/70 font-normal">件</span></span>
        </div>
        <div className="bg-amber-950/30 border border-amber-900/40 rounded-xl p-3.5 backdrop-blur-sm">
          <span className="text-amber-400 text-xs block mb-1">🔑 アカウント乗っ取り</span>
          <span className="text-2xl font-bold text-amber-400">{stats.takeoverCount} <span className="text-xs text-amber-500/70 font-normal">件</span></span>
        </div>
        <div className="bg-cyan-950/30 border border-cyan-900/40 rounded-xl p-3.5 backdrop-blur-sm">
          <span className="text-cyan-400 text-xs block mb-1">SaaS・委託先経由</span>
          <span className="text-2xl font-bold text-cyan-400">{stats.saasOriginCount} <span className="text-xs text-cyan-500/70 font-normal">件</span></span>
        </div>
      </div>

      {/* カレンダートグルボタン */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
        >
          <span>📅</span>
          <span>{showCalendar ? "カレンダーを閉じる" : "カレンダーを表示（10月1日〜の日毎集計）"}</span>
          <span className="text-[10px] text-slate-500">{showCalendar ? "▲" : "▼"}</span>
        </button>

        {selectedDate && (
          <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
            <span>絞り込み中:</span>
            <span className="underline">{selectedDate}</span>
            <button
              onClick={() => setSelectedDate(null)}
              className="ml-1 text-slate-400 hover:text-white"
            >
              (解除)
            </button>
          </span>
        )}
      </div>

      {/* カレンダーUI */}
      {showCalendar && (
        <IncidentCalendar
          items={initialItems}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}

      {/* 検索 ＆ 絞り込みコントロールバー */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 mb-8 backdrop-blur-md shadow-lg space-y-4">
        {/* 検索入力 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            🔍
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="企業名、SaaS名、脆弱性名、キーワードで検索（例: VPN、KARTE、スノーピーク、クレカ等）..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-white"
            >
              クリア
            </button>
          )}
        </div>

        {/* フィルタータブ群 */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/70">
          {/* 攻撃手法別フィルター（今回の目玉！） */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">🎯 攻撃手法:</span>
            {[
              { id: "ALL", label: `すべて (${initialItems.length})` },
              { id: "脆弱性悪用", label: `⚡ 脆弱性悪用 (${stats.vulnExploitCount})` },
              { id: "アカウント乗っ取り", label: `🔑 アカウント乗っ取り (${stats.takeoverCount})` },
              { id: "調査中・その他", label: "調査中・その他" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedAttackType(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  selectedAttackType === tab.id
                    ? tab.id === "脆弱性悪用"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : tab.id === "アカウント乗っ取り"
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30"
                      : "bg-white text-slate-950"
                    : "bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 深刻度 & 侵害経路フィルター */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* 深刻度 */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80 text-xs">
                <span className="text-[11px] text-slate-400 px-1">深刻度:</span>
                {["ALL", "HIGH", "MEDIUM"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedSeverity(lvl)}
                    className={`px-2 py-0.5 rounded font-semibold transition-all ${
                      selectedSeverity === lvl
                        ? lvl === "HIGH"
                          ? "bg-rose-600 text-white"
                          : lvl === "MEDIUM"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* 侵害経路 */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80 text-xs">
                <span className="text-[11px] text-slate-400 px-1">侵害経路:</span>
                {[
                  { id: "ALL", label: "すべて" },
                  { id: "SaaS・委託先侵害", label: "SaaS/委託先" },
                  { id: "自社システム侵害", label: "自社直接" },
                ].map((origin) => (
                  <button
                    key={origin.id}
                    onClick={() => setSelectedOrigin(origin.id)}
                    className={`px-2 py-0.5 rounded font-semibold transition-all ${
                      selectedOrigin === origin.id
                        ? origin.id.includes("SaaS")
                          ? "bg-cyan-600 text-white"
                          : origin.id.includes("自社")
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-700 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {origin.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              表示中: <span className="font-bold text-white">{filteredItems.length}</span> 件
            </div>
          </div>
        </div>
      </div>

      {/* インシデント一覧 */}
      <div className="space-y-5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-400">
            <p className="text-base font-semibold mb-1">条件に一致するインシデントは見つかりませんでした</p>
            <p className="text-xs text-slate-500">攻撃手法タブや検索ワードのフィルターを解除してお試しください</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item.id}
              className="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 p-5 sm:p-6 transition-all duration-200 hover:shadow-xl backdrop-blur-md"
            >
              {/* ヘッダー情報（企業、SaaS、攻撃手法、深刻度） */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/70">
                <div className="flex flex-wrap items-center gap-2">
                  {/* ① 被害・公表企業 */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white font-bold text-xs">
                    <span className="text-slate-400 text-[10px] font-normal uppercase">公表企業</span>
                    <span>🏢 {item.affectedCompany}</span>
                  </div>

                  <span className="text-slate-600 text-xs">←</span>

                  {/* ② 侵害元SaaS・システム */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 font-bold text-xs">
                    <span className="text-cyan-500/70 text-[10px] font-normal uppercase">侵害対象</span>
                    <span>⚡ {item.targetSystem}</span>
                  </div>

                  {/* ③ 攻撃手法バッジ */}
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      item.attackType === "脆弱性悪用"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : item.attackType === "アカウント乗っ取り"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    🎯 {item.attackType}
                  </span>
                </div>

                {/* 深刻度 & 日付 */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                      item.severity === "HIGH"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : item.severity === "MEDIUM"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}
                  >
                    深刻度: {item.severity}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {item.dateDisplay}
                  </span>
                </div>
              </div>

              {/* 発表タイトル */}
              <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-rose-400 transition-colors mb-3 leading-snug">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </h2>

              {/* 【新設】悪用された脆弱性の詳細ボックス（特定されている場合） */}
              {item.vulnerabilityDetails && (
                <div className="mb-3.5 px-3.5 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center gap-2 text-xs">
                  <span className="text-purple-400 font-bold shrink-0">⚡ 悪用された脆弱性:</span>
                  <span className="text-white font-mono font-bold bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
                    {item.vulnerabilityDetails}
                  </span>
                </div>
              )}

              {/* AI要約 & 影響・対応カード */}
              <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 space-y-2.5 mb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-1">
                    <span>✨</span>
                    <span>Gemini AI 要約</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-800/60 text-xs">
                  <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                    <span className="text-slate-400 font-semibold block mb-0.5">
                      ⚠️ 想定影響・流出懸念:
                    </span>
                    <span className="text-rose-300 font-medium">{item.impact}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                    <span className="text-slate-400 font-semibold block mb-0.5">
                      💡 推奨される対応:
                    </span>
                    <span className="text-amber-300 font-medium">{item.action}</span>
                  </div>
                </div>
              </div>

              {/* フッターアクションバー */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium border border-slate-700/60 transition-all active:scale-95"
                    title="Slackや社内チャットに貼り付けやすい形式でコピー"
                  >
                    {copiedId === item.id ? (
                      <>
                        <span className="text-emerald-400">✓</span>
                        <span className="text-emerald-400">コピー完了！</span>
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        <span>要約をコピー</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleShareX(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium border border-slate-700/60 transition-all active:scale-95"
                    title="Xでポスト"
                  >
                    <span>𝕏</span>
                    <span>シェア</span>
                  </button>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-rose-400 hover:text-rose-300 hover:underline shrink-0 group-hover:translate-x-0.5 transition-transform"
                >
                  公式発表（一次ソース）を開く <span>&rarr;</span>
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
