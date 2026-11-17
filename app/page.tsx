import { getCuratedNews } from "@/lib/news";

// 30分（1800秒）ごとに自動的に最新記事を取得・AI要約して更新
export const revalidate = 1800;

export default async function Home() {
  const { items, updatedAt } = await getCuratedNews();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* 背景装飾 */}
      <div className="fixed inset-0 pointer-events-none opacity-25">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* ヘッダーエリア */}
        <header className="mb-12 border-b border-slate-800 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              自動更新システム稼働中
            </div>
            <div className="text-xs text-slate-400 font-mono">
              最終更新: <span className="text-slate-200">{updatedAt}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent mb-3">
            Tech Pulse AI
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl">
            Zenn や はてなIT の最新トレンド記事を自動収集し、
            <span className="text-indigo-400 font-medium"> Gemini AI </span>
            が3行要約と要点をリアルタイムにキュレーションします。
          </p>
        </header>

        {/* 記事一覧グリッド */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 backdrop-blur-sm"
            >
              <div>
                {/* ソースバッジ & 日付 */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-semibold text-xs ${
                      item.source === "Zenn"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {item.source}
                  </span>
                  <span className="font-mono text-slate-500">
                    {item.pubDate ? new Date(item.pubDate).toLocaleDateString("ja-JP") : ""}
                  </span>
                </div>

                {/* 記事タイトル */}
                <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-4">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h2>

                {/* AI 要約ボックス */}
                <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                    <span>✨</span>
                    <span>Gemini AI 要約</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>
                  {item.takeaway && (
                    <div className="pt-2 border-t border-slate-800/60 text-xs text-indigo-200/90 flex items-start gap-1">
                      <span className="text-amber-400">💡</span>
                      <span className="font-medium">{item.takeaway}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* タグとリンク */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {(item.tags || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded bg-slate-800/70 text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 shrink-0 group-hover:translate-x-0.5 transition-transform"
                >
                  読む <span>&rarr;</span>
                </a>
              </div>
            </article>
          ))}
        </main>

        {/* フッター */}
        <footer className="mt-16 pt-8 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-2">
          <p>
            Powered by Next.js 16, Google Gemini API, Tailwind CSS, & Vercel
          </p>
          <p className="text-slate-600 font-mono">
            30分ごとに最新トレンドを自動取得・要約中
          </p>
        </footer>
      </div>
    </div>
  );
}
