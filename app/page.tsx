export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6">
      <div className="max-w-xl w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl text-center">
        <div className="inline-block px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-indigo-300 text-sm font-medium mb-6">
          🎉 Next.js & Vercel Deployment Test
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-indigo-300 via-white to-pink-300 bg-clip-text text-transparent">
          Sugiyama's First App
        </h1>
        <p className="text-slate-300 text-lg mb-8">
          Macの開発環境からGitHubを経由して、Vercelへ正常にデプロイされました！
        </p>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-indigo-400 font-semibold block text-sm">Framework</span>
            <span className="text-white text-lg font-bold">Next.js 16</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-indigo-400 font-semibold block text-sm">Styling</span>
            <span className="text-white text-lg font-bold">Tailwind CSS 4</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-indigo-400 font-semibold block text-sm">Hosting</span>
            <span className="text-white text-lg font-bold">Vercel</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-indigo-400 font-semibold block text-sm">Source Control</span>
            <span className="text-white text-lg font-bold">GitHub</span>
          </div>
        </div>
      </div>
    </div>
  );
}
