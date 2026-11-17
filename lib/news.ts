import fs from "fs";
import path from "path";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

export interface IncidentItem {
  id: string;
  title: string;
  link: string;
  pubDate: string; // YYYY-MM-DD
  dateDisplay: string; // "2026年11月17日"
  affectedCompany: string; // 被害・公表企業（例: ワールド、CAMPFIRE、スノーピーク）
  targetSystem: string; // 侵害・影響を受けたSaaSやシステム名（例: KARTE、社内ファイルサーバー）
  incidentOrigin: "SaaS・委託先侵害" | "自社システム侵害" | "その他";
  category: "不正アクセス" | "情報漏洩" | "脆弱性/注意喚起" | "ランサムウェア" | "その他";
  severity: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  impact: string; // 漏洩件数・影響範囲
  action: string; // 推奨対応
}

const parser = new Parser();

// 蓄積されたローカルデータベースを読み込み
export function getStoredIncidents(): IncidentItem[] {
  try {
    const filePath = path.join(process.cwd(), "data/incidents.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as IncidentItem[];
    }
  } catch (err) {
    console.error("Error reading stored incidents:", err);
  }
  return [];
}

// 3時間ごとの最新差分取得用
const RECENT_RSS_URL = encodeURI(
  "https://news.google.com/rss/search?q=(不正アクセス OR 情報漏洩 OR 漏えい) (公式発表 OR お詫び OR 調査報告 OR 適時開示 OR コーポレート)&hl=ja&gl=JP&ceid=JP:ja"
);

export async function getCuratedIncidents(): Promise<{ items: IncidentItem[]; updatedAt: string }> {
  const baseItems = getStoredIncidents();

  // 最新の差分を取得（必要に応じてGeminiで補完）
  try {
    const feed = await parser.parseURL(RECENT_RSS_URL);
    const recent = (feed.items || []).slice(0, 5);
    const existingLinks = new Set(baseItems.map((b) => b.link));

    const newItemsRaw = recent.filter((r) => r.link && !existingLinks.has(r.link));

    if (newItemsRaw.length > 0 && process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
以下のインシデントについて、利用企業名、侵害対象SaaS/システム名、種別（SaaS・委託先侵害/自社システム侵害）、深刻度(HIGH/MEDIUM/LOW)、要約、影響範囲、推奨対応をJSON配列で出力してください。

入力:
${JSON.stringify(newItemsRaw.map((it, idx) => ({ index: idx, title: it.title })))}

出力形式（JSON配列のみ）:
[
  {
    "index": 0,
    "affectedCompany": "企業名",
    "targetSystem": "SaaSまたはシステム名",
    "incidentOrigin": "SaaS・委託先侵害 | 自社システム侵害",
    "category": "不正アクセス | 情報漏洩 | その他",
    "severity": "HIGH | MEDIUM | LOW",
    "summary": "要約文",
    "impact": "影響範囲",
    "action": "推奨対応"
  }
]
`;
      const res = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
      });

      const cleaned = (res.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      newItemsRaw.forEach((it, idx) => {
        const d = parsed.find((p: { index: number }) => p.index === idx);
        const pubDateObj = it.pubDate ? new Date(it.pubDate) : new Date();
        const dateStr = pubDateObj.toISOString().slice(0, 10);

        baseItems.unshift({
          id: Buffer.from(it.link || "").toString("base64").slice(0, 16),
          title: it.title || "",
          link: it.link || "",
          pubDate: dateStr,
          dateDisplay: pubDateObj.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          affectedCompany: d?.affectedCompany || "各社公式発表",
          targetSystem: d?.targetSystem || "関連システム",
          incidentOrigin: d?.incidentOrigin || "SaaS・委託先侵害",
          category: d?.category || "不正アクセス",
          severity: d?.severity || "HIGH",
          summary: d?.summary || "公式発表をご確認ください。",
          impact: d?.impact || "調査中・公式資料参照",
          action: d?.action || "パスワードの確認等",
        });
      });
    }
  } catch (err) {
    console.error("Live delta check error, using base data:", err);
  }

  // 日付順（新しい順）に並べ替え
  baseItems.sort((a, b) => b.pubDate.localeCompare(a.pubDate));

  return {
    items: baseItems,
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
