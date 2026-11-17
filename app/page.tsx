import { getCuratedIncidents } from "@/lib/news";
import IncidentDashboard from "@/components/IncidentDashboard";

// 3時間（10,800秒）ごとに自動的に最新公式ソースを取得してAI再分析
export const revalidate = 10800;

export default async function Home() {
  const { items, updatedAt } = await getCuratedIncidents();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
      {/* 背景装飾 */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* ヘッダーエリア */}
        <header className="mb-8 border-b border-slate-800 pb-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>公式発表・一次ソース特化巡回中</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              最終巡回: <span className="text-slate-200 font-semibold">{updatedAt}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            Security Incident Watch
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            各企業・組織の
            <span className="text-rose-400 font-semibold">「公式発表・お詫び・適時開示」</span>
            から、不正アクセス・個人情報漏洩インシデントのみを自動抽出。
            Gemini AI が影響範囲・流出懸念・推奨対応を分析し、実務で使える速報形式でお届けします。
          </p>
        </header>

        {/* インタラクティブ ダッシュボード */}
        <main>
          <IncidentDashboard initialItems={items} updatedAt={updatedAt} />
        </main>

        {/* フッター */}
        <footer className="mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <p>
            Security Incident Watch — 自動取得・公式一次ソース特化キュレーション
          </p>
          <p className="font-mono text-slate-600">
            Auto-Refresh: 3 Hours (10,800s) | Engine: Google Gemini 3.5 Flash | Next.js 16 + Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}
