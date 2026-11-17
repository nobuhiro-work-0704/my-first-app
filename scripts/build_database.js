const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function fetchAllFeeds() {
  const queries = [
    "(不正アクセス OR 情報漏洩 OR 漏えい) (公式発表 OR お詫び OR 調査報告 OR 適時開示 OR コーポレート) after:2026-10-01 before:2026-11-01",
    "(不正アクセス OR 情報漏洩 OR 漏えい) (公式発表 OR お詫び OR 調査報告 OR 適時開示 OR コーポレート) after:2026-11-01",
  ];

  const seenUrls = new Set();
  const rawItems = [];

  for (const q of queries) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ja&gl=JP&ceid=JP:ja`;
    try {
      const feed = await parser.parseURL(url);
      console.log(`Fetched ${feed.items.length} items for query: ${q.slice(0, 30)}...`);

      for (const it of feed.items) {
        if (!it.title || !it.link) continue;
        // ニュース解説や記事論評ではなく公式発表・お詫び・適時開示・コーポレート系を優先
        if (seenUrls.has(it.link)) continue;
        seenUrls.add(it.link);

        const parts = it.title.split(" - ");
        const title = parts.length > 1 ? parts.slice(0, -1).join(" - ") : it.title;
        const source = parts.length > 1 ? parts[parts.length - 1] : "公式発表";

        const pubDateObj = it.pubDate ? new Date(it.pubDate) : new Date();
        const dateStr = pubDateObj.toISOString().slice(0, 10);

        rawItems.push({
          title: title.trim(),
          link: it.link,
          dateStr: dateStr,
          rawSource: source.trim(),
        });
      }
    } catch (e) {
      console.error("Error fetching feed:", e.message);
    }
  }

  // 日付順（新しい順）にソート
  rawItems.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  console.log(`Total unique items collected: ${rawItems.length}`);
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
以下は日本の企業・自治体による「不正アクセス・情報漏洩に関する公式発表」一覧です。

各インシデントについて、特に【利用・公表企業】と【侵害対象となったSaaS・システム】を明確に区別して分析し、以下のJSON形式のみを出力してください。

入力一覧:
${JSON.stringify(batch.map((it, idx) => ({ index: idx, title: it.title, source: it.rawSource, date: it.dateStr })))}

出力形式（JSON配列のみ、コードブロック不要）:
[
  {
    "index": 0,
    "affectedCompany": "公表・被害企業名（例: CAMPFIRE、ワールド、スノーピーク、前橋市など）",
    "targetSystem": "侵害・影響を受けたSaaSやシステム名（例: KARTE、社内ファイルサーバー、まちの安全ひろメール、自社ECサイトなど）",
    "incidentOrigin": "SaaS・委託先侵害 | 自社システム侵害 | その他",
    "category": "不正アクセス | 情報漏洩 | ランサムウェア | 設定不備 | その他",
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
          category: data?.category || "情報漏洩",
          severity: data?.severity || "MEDIUM",
          summary: data?.summary || "公式発表をご確認ください。",
          impact: data?.impact || "調査中・公式資料参照",
          action: data?.action || "不審な連絡への警戒",
        });
      });
    } catch (err) {
      console.error("Batch analysis failed, using fallback:", err.message);
      batch.forEach((it) => {
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
          incidentOrigin: "自社システム侵害",
          category: "情報漏洩",
          severity: "MEDIUM",
          summary: "各社公式発表をご確認ください。",
          impact: "公式リリース参照",
          action: "不審な連絡への警戒",
        });
      });
    }

    // APIレートリミット対策で少し待機
    await new Promise((r) => setTimeout(r, 1000));
  }

  return results;
}

async function main() {
  const rawItems = await fetchAllFeeds();
  // 上位25件程度（10月1日以降の主要インシデント）を厳選
  const selected = rawItems.slice(0, 24);
  console.log(`Analyzing ${selected.length} curated incidents...`);

  const analyzed = await analyzeInBatches(selected);

  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outPath = path.join(dataDir, "incidents.json");
  fs.writeFileSync(outPath, JSON.stringify(analyzed, null, 2), "utf-8");
  console.log(`Saved ${analyzed.length} incidents to ${outPath}`);
}

main().catch(console.error);
