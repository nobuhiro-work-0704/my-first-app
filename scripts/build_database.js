const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 一次ソース（公式発表・お詫び・適時開示・PRTimes・自治体）に特化したクエリ群
const QUERIES = [
  // 1. PR TIMES（企業が公式発表する一次リリース）
  "site:prtimes.jp (不正アクセス OR 情報漏洩 OR 漏えい) (お詫び OR 調査報告 OR 不正利用) after:2026-10-01",
  // 2. 10月前半の公式お詫び・報告リリース
  `("不正アクセス" OR "情報漏洩" OR "個人情報漏えい") ("お詫びとお知らせ" OR "お知らせとお詫び" OR "調査結果のご報告" OR "適時開示" OR "に関するご報告") after:2026-10-01 before:2026-10-16`,
  // 3. 10月後半の公式お詫び・報告リリース
  `("不正アクセス" OR "情報漏洩" OR "個人情報漏えい") ("お詫びとお知らせ" OR "お知らせとお詫び" OR "調査結果のご報告" OR "適時開示" OR "に関するご報告") after:2026-10-16 before:2026-11-01`,
  // 4. 11月の公式お詫び・報告リリース
  `("不正アクセス" OR "情報漏洩" OR "個人情報漏えい") ("お詫びとお知らせ" OR "お知らせとお詫び" OR "調査結果のご報告" OR "適時開示" OR "に関するご報告") after:2026-11-01`,
];

// ニュース解説やオピニオン記事を除外するためのブラックリスト単語
const EXCLUDE_WORDS = [
  "値段は誰が決める",
  "解説",
  "まとめ",
  "コラム",
  "トレンド",
  "セミナー",
  "新機能",
  "サービス提供開始",
];

// 一次ソースらしいキーワード（必須）
const MUST_HAVE_KEYWORDS = [
  "お詫び",
  "お知らせ",
  "ご報告",
  "調査結果",
  "適時開示",
  "流出について",
  "漏えいについて",
  "第一報",
  "第二報",
  "第三報",
  "第4報",
  "第5報",
  "第6報",
  "第7報",
  "第8報",
  "第9報",
];

async function collectPrimarySources() {
  const seenTitles = new Set();
  const rawItems = [];

  for (const q of QUERIES) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ja&gl=JP&ceid=JP:ja`;
    try {
      const feed = await parser.parseURL(url);
      console.log(`Query fetched ${feed.items.length} items`);

      for (const it of feed.items) {
        if (!it.title || !it.link) continue;

        // 除外チェック
        if (EXCLUDE_WORDS.some((word) => it.title.includes(word))) continue;

        // 必須キーワードチェック（一次ソースのお詫び・お知らせ・報告であること）
        const isPrimary = MUST_HAVE_KEYWORDS.some((kw) => it.title.includes(kw));
        if (!isPrimary) continue;

        // 重複チェック（タイトルの類似性）
        const normalizedTitle = it.title.replace(/\s+/g, "").slice(0, 30);
        if (seenTitles.has(normalizedTitle)) continue;
        seenTitles.add(normalizedTitle);

        const parts = it.title.split(" - ");
        const title = parts.length > 1 ? parts.slice(0, -1).join(" - ") : it.title;
        let source = parts.length > 1 ? parts[parts.length - 1] : "公式発表";

        // 日経会社情報DIGITAL(適時開示) は適時開示の一次ソース
        if (it.title.includes("適時開示")) {
          source = "適時開示 (公式IR)";
        } else if (it.link.includes("prtimes.jp") || it.title.includes("PR TIMES")) {
          source = "PR TIMES (公式プレスリリース)";
        }

        const pubDateObj = it.pubDate ? new Date(it.pubDate) : new Date();
        const dateStr = pubDateObj.toISOString().slice(0, 10);

        rawItems.push({
          title: title.trim(),
          link: it.link,
          dateStr,
          rawSource: source.trim(),
        });
      }
    } catch (e) {
      console.error("Error fetching feed:", e.message);
    }
  }

  // 日付の新しい順にソート
  rawItems.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  console.log(`Total filtered primary-source items: ${rawItems.length}`);
  return rawItems;
}

async function analyzeInBatches(items) {
  const BATCH_SIZE = 6;
  const results = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    console.log(`Analyzing batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(items.length / BATCH_SIZE)} (${batch.length} items)...`);

    const prompt = `
あなたはサイバーセキュリティインシデントの分析専門家です。
以下は日本の企業・自治体による【一次ソース（公式発表・お詫び・適時開示・公式リリース）】の一覧です。

各インシデントについて、特に【利用・公表企業（affectedCompany）】と【侵害対象となったSaaS・システム（targetSystem）】を明確に区別して分析し、以下のJSON形式のみを出力してください。

入力一覧:
${JSON.stringify(batch.map((it, idx) => ({ index: idx, title: it.title, source: it.rawSource, date: it.dateStr })))}

出力形式（JSON配列のみ、コードブロック不要）:
[
  {
    "index": 0,
    "affectedCompany": "公表・被害企業名（例: CAMPFIRE、スノーピーク、スマートニュース、SmartHR、前橋市など）",
    "targetSystem": "侵害・影響を受けたSaaSやシステム名（例: KARTE、Notion AI委託先、社内ファイルサーバー、まちの安全ひろメール、自社ECなど）",
    "incidentOrigin": "SaaS・委託先侵害 | 自社システム侵害",
    "category": "不正アクセス | 情報漏洩 | ランサムウェア | その他",
    "severity": "HIGH | MEDIUM | LOW",
    "summary": "事象のわかりやすい要約（2行程度）",
    "impact": "影響範囲・流出懸念（件数や氏名・クレカ等の有無）",
    "action": "推奨対応（パスワード変更、不審連絡への警戒など）"
  }
]
`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
      });

      const text = response.text || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      batch.forEach((it, idx) => {
        const data = parsed.find((p) => p.index === idx);
        results.push({
          id: Buffer.from(it.link).toString("base64").slice(0, 16),
          title: it.title,
          link: it.link,
          pubDate: it.dateStr,
          dateDisplay: new Date(it.dateStr).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          affectedCompany: data?.affectedCompany || it.rawSource,
          targetSystem: data?.targetSystem || "自社システム",
          incidentOrigin: data?.incidentOrigin || "自社システム侵害",
          category: data?.category || "不正アクセス",
          severity: data?.severity || "HIGH",
          summary: data?.summary || "公式発表をご確認ください。",
          impact: data?.impact || "調査中・公式資料参照",
          action: data?.action || "不審な連絡への警戒",
        });
      });
    } catch (err) {
      console.error("Batch analysis error:", err.message);
      batch.forEach((it) => {
        // フォールバックでもタイトルから簡易抽出
        results.push({
          id: Buffer.from(it.link).toString("base64").slice(0, 16),
          title: it.title,
          link: it.link,
          pubDate: it.dateStr,
          dateDisplay: new Date(it.dateStr).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          affectedCompany: it.rawSource,
          targetSystem: "関連システム",
          incidentOrigin: "SaaS・委託先侵害",
          category: "不正アクセス",
          severity: "HIGH",
          summary: "各社公式発表をご確認ください。",
          impact: "公式リリース参照",
          action: "不審な連絡への警戒",
        });
      });
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  return results;
}

async function main() {
  const items = await collectPrimarySources();
  // 最大45件程度（10月1日以降の一次ソースを網羅）
  const selected = items.slice(0, 45);
  console.log(`Selected ${selected.length} primary source incidents to analyze...`);

  const analyzed = await analyzeInBatches(selected);

  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outPath = path.join(dataDir, "incidents.json");
  fs.writeFileSync(outPath, JSON.stringify(analyzed, null, 2), "utf-8");
  console.log(`Saved ${analyzed.length} primary source incidents to ${outPath}`);
}

main().catch(console.error);
