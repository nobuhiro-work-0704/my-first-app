import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate?: string;
  source: string;
  summary?: string;
  takeaway?: string;
  tags?: string[];
}

const parser = new Parser();

const RSS_SOURCES = [
  { name: "Zenn", url: "https://zenn.dev/feed" },
  { name: "はてなIT", url: "https://b.hatena.ne.jp/hotentry/it.rss" },
];

export async function fetchRawNews(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      const recentItems = (feed.items || []).slice(0, 4);

      for (const item of recentItems) {
        if (!item.title || !item.link) continue;
        items.push({
          id: Buffer.from(item.link).toString("base64").slice(0, 16),
          title: item.title.trim(),
          link: item.link,
          pubDate: item.pubDate || new Date().toISOString(),
          source: source.name,
        });
      }
    } catch (err) {
      console.error(`Failed to fetch from ${source.name}:`, err);
    }
  }

  // 日付の新しい順にソートして上位6件を厳選
  return items.slice(0, 6);
}

export async function summarizeWithGemini(items: NewsItem[]): Promise<NewsItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || items.length === 0) {
    return items.map((item) => ({
      ...item,
      summary: "記事のリンクをクリックして詳細をご覧ください。",
      tags: [item.source, "Tech"],
    }));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
以下のテクノロジー・Web開発系の記事一覧について、それぞれ日本のエンジニア向けに魅力的な2〜3行の日本語要約（summary）、一言ポイント（takeaway）、および3つのタグ（tags）を生成してください。

対象記事:
${JSON.stringify(items.map((it, idx) => ({ index: idx, title: it.title, source: it.source })))}

必ず以下のJSON配列フォーマットのみで出力してください（Markdownのコードブロックなども含めないでください）:
[
  {
    "index": 0,
    "summary": "要約文...",
    "takeaway": "一言...",
    "tags": ["AI", "React", "Next.js"]
  }
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const text = response.text || "";
    // JSON部分のみ抽出
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{
      index: number;
      summary: string;
      takeaway: string;
      tags: string[];
    }>;

    return items.map((item, idx) => {
      const aiData = parsed.find((p) => p.index === idx);
      return {
        ...item,
        summary: aiData?.summary || "最新のテクノロジートレンド記事です。",
        takeaway: aiData?.takeaway || "要チェック！",
        tags: aiData?.tags || [item.source, "Tech"],
      };
    });
  } catch (err) {
    console.error("Gemini summarization failed:", err);
    return items.map((item) => ({
      ...item,
      summary: "注目のテクノロジートレンド記事です。",
      tags: [item.source, "Tech"],
    }));
  }
}

export async function getCuratedNews(): Promise<{ items: NewsItem[]; updatedAt: string }> {
  const rawItems = await fetchRawNews();
  const summarizedItems = await summarizeWithGemini(rawItems);
  return {
    items: summarizedItems,
    updatedAt: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
  };
}
