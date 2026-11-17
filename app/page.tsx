import { getCuratedIncidents } from "@/lib/news";

// 3時間（3 * 3600 = 10800秒）ごとに自動的に最新公式ソースを取得してAI再分析
export const revalidate = 10800;

export default async function Home() {
  const { items, updatedAt } = await getCuratedIncidents();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased selection:bg-rose-500 selection:text-white">
      {/* 背景の警告グラデーション */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-600 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* ヘッダーエリア */}
        <header className="mb-10 border-b border-neutral-800 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>3時間おき自動巡回中（公式ソース特化）</span>
            </div>
            <div className="text-xs text-neutral-400 font-mono">
              最終更新: <span className="text-neutral-200 font-semibold">{updatedAt}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            Security Incident Watch
          </h1>
          <p className="text-base sm:text-lg text-neutral-400 max-w-3xl leading-relaxed">
            各企業・組織の
            <span className="text-rose-400 font-semibold">「公式発表・お詫び・適時開示」</span>
            から、最新の不正アクセスおよび情報漏洩インシデントのみを自動収集。
            Gemini AI が影響範囲と推奨対応を要約・リアルタイム配信しています。
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500">
            <span>🛡️ 対象: 各社コーポレート公式発表 / 適時開示</span>
            <span>⚡ 更新頻度: 3時間毎</span>
            <span>🤖 AIモデル: Gemini 3.5 Flash</span>
          </div>
        </header>

        {/* インシデント一覧 */}
        <main className="space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-16 text-neutral-500">
              現在直近のインシデント公式発表を巡回中です...
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="group relative rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 p-6 sm:p-7 transition-all duration-200 hover:shadow-2xl hover:shadow-rose-950/20 backdrop-blur-md"
              >
                {/* 上段：企業名、深刻度、カテゴリ、公表日 */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* 企業・組織バッジ */}
                    <span className="px-3 py-1 rounded-lg bg-neutral-800 text-white font-bold text-xs border border-neutral-700">
                      🏢 {item.sourceCompany}
                    </span>

                    {/* カテゴリ */}
                    <span className="px-2.5 py-1 rounded-md bg-neutral-800/80 text-neutral-300 text-xs font-medium">
                      {item.category}
                    </span>

                    {/* 深刻度バッジ */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
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

                  <span className="font-mono text-xs text-neutral-500">
                    {item.pubDate ? new Date(item.pubDate).toLocaleDateString("ja-JP") : ""}
                  </span>
                </div>

                {/* 発表タイトル */}
                <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-rose-400 transition-colors mb-4 leading-snug">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h2>

                {/* AI 要約 & 影響範囲ブロック */}
                <div className="rounded-xl bg-neutral-950/80 border border-neutral-800/90 p-4 sm:p-5 space-y-3 mb-4">
                  <div>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      📝 インシデント概要（AI要約）
                    </span>
                    <p className="text-sm text-neutral-200 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-800/80 text-xs">
                    <div>
                      <span className="text-neutral-400 font-semibold block mb-0.5">
                        ⚠️ 想定影響・流出懸念:
                      </span>
                      <span className="text-rose-300 font-medium">{item.impact}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-semibold block mb-0.5">
                        💡 推奨される対応:
                      </span>
                      <span className="text-amber-300 font-medium">{item.action}</span>
                    </div>
                  </div>
                </div>

                {/* 公式リンク */}
                <div className="flex justify-end items-center pt-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    公式発表（一次ソース）を開く <span>&rarr;</span>
                  </a>
                </div>
              </article>
            ))
          )}
        </main>

        {/* フッター */}
        <footer className="mt-16 pt-8 border-t border-neutral-800 text-center text-xs text-neutral-500 space-y-2">
          <p>
            Security Incident Watch — 自動取得・公式一次ソース特化キュレーション
          </p>
          <p className="font-mono text-neutral-600">
            Update Interval: 3 Hours (10,800s) | Engine: Google Gemini 3.5 Flash
          </p>
        </footer>
      </div>
    </div>
  );
}
