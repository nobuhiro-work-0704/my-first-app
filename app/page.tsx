import { getCuratedIncidents } from "@/lib/news";
import IncidentDashboard from "@/components/IncidentDashboard";

// 3時間（10,800秒）ごとに自動的に最新公式ソースを取得してAI再分析
export const revalidate = 10800;

export default async function Home() {
  const { items, updatedAt } = await getCuratedIncidents();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* ヘッダーエリア（グラデーションなし・シンプル） */}
        <header className="mb-8 border-b border-neutral-800 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              公式一次ソース自動巡回中（3時間毎）
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              最終更新: {updatedAt}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Security Incident Watch
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            各企業・組織の公式お詫び・適時開示・公式リリースから、不正アクセスおよび情報漏洩インシデントを収集・AI要約。
          </p>
        </header>

        {/* メインダッシュボード */}
        <main>
          <IncidentDashboard initialItems={items} updatedAt={updatedAt} />
        </main>

        {/* フッター */}
        <footer className="mt-16 pt-6 border-t border-neutral-900 text-center text-xs text-neutral-600">
          Security Incident Watch — 公式一次ソース特化キュレーション
        </footer>
      </div>
    </div>
  );
}
