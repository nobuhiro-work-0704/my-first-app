"use client";

import { useState, useMemo } from "react";
import { IncidentItem } from "@/lib/news";

interface Props {
  initialItems: IncidentItem[];
  updatedAt: string;
}

export default function IncidentDashboard({ initialItems, updatedAt }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 検索とフィルター処理
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceCompany?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.impact.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        selectedSeverity === "ALL" || item.severity === selectedSeverity;

      return matchesSearch && matchesSeverity;
    });
  }, [initialItems, searchQuery, selectedSeverity]);

  // 統計情報
  const stats = useMemo(() => {
    const total = initialItems.length;
    const highCount = initialItems.filter((i) => i.severity === "HIGH").length;
    const mediumCount = initialItems.filter((i) => i.severity === "MEDIUM").length;
    return { total, highCount, mediumCount };
  }, [initialItems]);

  // Slack / テキスト共有用コピー
  const handleCopy = (item: IncidentItem) => {
    const text = `【⚠️セキュリティ速報】${item.sourceCompany || "公式発表"}
タイトル: ${item.title}
深刻度: ${item.severity} (${item.category})
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
    const shareText = `【セキュリティ速報】${item.sourceCompany}：${item.title.slice(0, 50)}...\n深刻度: ${item.severity}\n`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(item.link)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      {/* 統計ミニカウンターバー */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur-sm">
          <span className="text-slate-400 text-xs block mb-1">直近検知インシデント</span>
          <span className="text-2xl font-bold text-white">{stats.total} <span className="text-xs text-slate-500 font-normal">件</span></span>
        </div>
        <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-3.5 backdrop-blur-sm">
          <span className="text-rose-400 text-xs block mb-1">要警戒（HIGH）</span>
          <span className="text-2xl font-bold text-rose-400">{stats.highCount} <span className="text-xs text-rose-500/70 font-normal">件</span></span>
        </div>
        <div className="bg-amber-950/30 border border-amber-900/40 rounded-xl p-3.5 backdrop-blur-sm">
          <span className="text-amber-400 text-xs block mb-1">注意（MEDIUM）</span>
          <span className="text-2xl font-bold text-amber-400">{stats.mediumCount} <span className="text-xs text-amber-500/70 font-normal">件</span></span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur-sm">
          <span className="text-slate-400 text-xs block mb-1">更新サイクル</span>
          <span className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            3時間毎
          </span>
        </div>
      </div>

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
            placeholder="企業名、キーワードで検索（例: スノーピーク、KARTE、クレカ、漏洩など）..."
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

        {/* 深刻度フィルタータブ */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/70">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline">深刻度:</span>
            {[
              { id: "ALL", label: `すべて (${initialItems.length})` },
              { id: "HIGH", label: `HIGH (${stats.highCount})` },
              { id: "MEDIUM", label: `MEDIUM (${stats.mediumCount})` },
              { id: "LOW", label: "LOW" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSeverity(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedSeverity === tab.id
                    ? tab.id === "HIGH"
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                      : tab.id === "MEDIUM"
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                      : "bg-white text-slate-950"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            表示中: <span className="font-bold text-white">{filteredItems.length}</span> 件
          </div>
        </div>
      </div>

      {/* インシデントリスト */}
      <div className="space-y-5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-400">
            <p className="text-base font-semibold mb-1">条件に一致するインシデントは見つかりませんでした</p>
            <p className="text-xs text-slate-500">検索ワードを変更するか、深刻度フィルターを「すべて」に戻してください</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item.id}
              className="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 p-5 sm:p-6 transition-all duration-200 hover:shadow-xl backdrop-blur-md"
            >
              {/* ヘッダー情報（企業、カテゴリ、深刻度、公表日） */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-md bg-slate-800 text-white font-bold text-xs border border-slate-700/80">
                    🏢 {item.sourceCompany}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-slate-800/80 text-slate-300 text-xs">
                    {item.category}
                  </span>
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
                </div>

                <span className="font-mono text-xs text-slate-400">
                  {item.pubDate ? new Date(item.pubDate).toLocaleDateString("ja-JP") : ""}
                </span>
              </div>

              {/* 発表タイトル */}
              <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-rose-400 transition-colors mb-3.5 leading-snug">
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
              </h2>

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

              {/* フッターアクションバー（Slack共有コピー・X共有・一次ソースリンク） */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
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
