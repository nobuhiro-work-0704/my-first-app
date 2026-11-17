import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

export interface IncidentItem {
  id: string;
  title: string;
  link: string;
  pubDate?: string;
  sourceCompany?: string;
  category: "不正アクセス" | "情報漏洩" | "脆弱性/注意喚起" | "ランサムウェア" | "その他";
  severity: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  impact: string; // 漏洩件数・影響範囲
  action: string; // 推奨されるユーザー対応
}

const parser = new Parser({
  customFields: {
    item: ["source"],
  },
});

// 各社の公式発表・適時開示・お詫びリリースをピンポイント収集する検索フィード
const INCIDENT_RSS_URL = encodeURI(
  "https://news.google.com/rss/search?q=(不正アクセス OR 情報漏洩 OR 個人情報流出 OR 漏えい) (公式発表 OR お詫び OR 調査報告 OR 適時開示 OR コーポレート OR プレスリリース)&hl=ja&gl=JP&ceid=JP:ja"
);

export async function fetchRawIncidents(): Promise<Array<{ title: string; link: string; pubDate: string; rawSource: string }>> {
  try {
    const feed = await parser.parseURL(INCIDENT_RSS_URL);
    const validItems = (feed.items || [])
      .filter((it) => it.title && it.link)
      .slice(0, 8); // 上位8件を抽出

    return validItems.map((it) => {
      // タイトルから発表元を抽出（例: "不正アクセス... - スノーピーク" -> source: "スノーピーク"）
      const parts = it.title?.split(" - ") || [];
      const title = parts.length > 1 ? parts.slice(0, -1).join(" - ") : it.title || "";
      const rawSource = parts.length > 1 ? parts[parts.length - 1] : "各社公式発表";

      return {
        title: title.trim(),
        link: it.link || "",
        pubDate: it.pubDate || new Date().toISOString(),
        rawSource: rawSource.trim(),
      };
    });
  } catch (err) {
    console.error("Failed to fetch incident feeds:", err);
    return [];
  }
}

export async function analyzeIncidentsWithGemini(
  rawList: Array<{ title: string; link: string; pubDate: string; rawSource: string }>
): Promise<IncidentItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || rawList.length === 0) {
    return rawList.map((it) => ({
      id: Buffer.from(it.link).toString("base64").slice(0, 16),
      title: it.title,
      link: it.link,
      pubDate: it.pubDate,
      sourceCompany: it.rawSource,
      category: "情報漏洩",
      severity: "MEDIUM",
      summary: "公式発表の詳細はリンク先をご確認ください。",
      impact: "調査中または公式発表参照",
      action: "不審な連絡への警戒、パスワードの確認",
    }));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
あなたはサイバーセキュリティアナリストです。
以下は各企業・組織から公表された最新の不正アクセス・個人情報漏洩・セキュリティ事故に関する公式ニュース一覧です。

各インシデントについて、タイトルと発表元情報から分析し、以下のJSON形式で出力してください。

分析対象:
${JSON.stringify(rawList.map((it, idx) => ({ index: idx, title: it.title, source: it.rawSource })))}

出力形式（必ずこのJSON配列のみを出力し、コードブロックマーカーや他の説明は含めないでください）:
[
  {
    "index": 0,
    "sourceCompany": "企業名・組織名（例: スノーピーク、CAMPFIREなど）",
    "category": "不正アクセス | 情報漏洩 | 脆弱性/注意喚起 | ランサムウェア | その他",
    "severity": "HIGH | MEDIUM | LOW",
    "summary": "事象のわかりやすい要約（2行程度）",
    "impact": "影響範囲・漏洩の恐れがある情報（例: 会員氏名・メアドなど、クレカ有無など）",
    "action": "一般ユーザーや関係者が取るべきアクション（例: パスワード使い回しの見直し、不審メールの警戒）"
  }
]

深刻度(severity)の判定基準:
- HIGH: クレジットカード情報漏洩の疑い、大規模な個人情報流出、重要インフラ障害
- MEDIUM: 氏名、メールアドレス、電話番号等の流出疑い、委託先経由の不正アクセス
- LOW: 未遂・未検知の事前注意喚起、被害が限定的な設定不備など
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const text = response.text || "";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{
      index: number;
      sourceCompany: string;
      category: "不正アクセス" | "情報漏洩" | "脆弱性/注意喚起" | "ランサムウェア" | "その他";
      severity: "HIGH" | "MEDIUM" | "LOW";
      summary: string;
      impact: string;
      action: string;
    }>;

    return rawList.map((it, idx) => {
      const data = parsed.find((p) => p.index === idx);
      return {
        id: Buffer.from(it.link).toString("base64").slice(0, 16),
        title: it.title,
        link: it.link,
        pubDate: it.pubDate,
        sourceCompany: data?.sourceCompany || it.rawSource,
        category: data?.category || "情報漏洩",
        severity: data?.severity || "MEDIUM",
        summary: data?.summary || "公式発表をご確認ください。",
        impact: data?.impact || "調査中・公表資料参照",
        action: data?.action || "パスワード等の確認をおすすめします。",
      };
    });
  } catch (err) {
    console.error("Gemini analysis error:", err);
    return rawList.map((it) => ({
      id: Buffer.from(it.link).toString("base64").slice(0, 16),
      title: it.title,
      link: it.link,
      pubDate: it.pubDate,
      sourceCompany: it.rawSource,
      category: "情報漏洩",
      severity: "MEDIUM",
      summary: "各社公式発表の詳細はリンク先をご確認ください。",
      impact: "公式アナウンス参照",
      action: "不審な連絡への注意",
    }));
  }
}

export async function getCuratedIncidents(): Promise<{ items: IncidentItem[]; updatedAt: string }> {
  const rawList = await fetchRawIncidents();
  const analyzed = await analyzeIncidentsWithGemini(rawList);

  return {
    items: analyzed,
    updatedAt: new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}
