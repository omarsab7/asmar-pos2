// Rule-based AI router for Asmar AI Assistant.
// Parses Arabic/English text (from typing, speech-to-text, or OCR) into an intent.
import { normAr } from "@/lib/utils";

export type Intent =
  | "GET_SALES"
  | "GET_PROFIT"
  | "GET_INVENTORY"
  | "CREATE_SALE"
  | "UPDATE_INVENTORY"
  | "TOP_PRODUCTS"
  | "ANALYZE_BUSINESS"
  | "PARSE_INVOICE"
  | "ANALYZE_SHELF"
  | "UNKNOWN";

export type RangeKey = "today" | "week" | "month" | "year";

export interface ParsedQuery {
  intent: Intent;
  qty?: number;      // quantity / amount detected
  subject?: string;  // cleaned noun phrase (product or ingredient)
  range?: RangeKey;  // time range for reports
  raw: string;
}

function detectRange(t: string): RangeKey {
  if (/(هالسنه|السنه|هالعام|العام|سنه|سنة|عام|year)/.test(t)) return "year";
  if (/(هالشهر|الشهر|شهر|month)/.test(t)) return "month";
  if (/(هالاسبوع|الاسبوع|اسبوع|week)/.test(t)) return "week";
  return "today";
}

const NUM_WORDS: Record<string, number> = {
  "صفر": 0, "وحده": 1, "واحد": 1, "وحدة": 1, "اثنين": 2, "اثنان": 2, "تنين": 2,
  "ثلاثه": 3, "ثلاثة": 3, "تلاته": 3, "تلاتة": 3, "اربعه": 4, "أربعة": 4, "اربعة": 4,
  "خمسه": 5, "خمسة": 5, "سته": 6, "ستة": 6, "سبعه": 7, "سبعة": 7,
  "ثمانيه": 8, "تمانيه": 8, "تسعه": 9, "تسعة": 9, "عشره": 10, "عشرة": 10,
};

// words to strip when isolating the subject noun
const STOP = [
  "بدي","بدنا","اعمل","اعملي","عملي","سوي","ورجيني","ورجني","فرجيني","اعطيني","عطيني",
  "كم","شو","قديش","قدي","هلق","اليوم","تبع","تبعون","من","فضلك","لو","سمحت","يا","ال",
  "المخزون","مخزون","بيع","بيعه","بيعة","بعلي","سيل","زيد","زود","ضيف","اضف","أضف","حدث",
  "حدّث","نقص","الى","على","عن","ربح","الربح","الارباح","ارباح","مبيعات","المبيعات","المنتج",
  "منتج","اكثر","أكثر","مبيعا","مبيعاً","افضل","أفضل","please","the","a","sale","sell","stock",
  "show","me","add","update","of","for","to","and","حللي","حلل","تحليل","تقرير","كيف","الشغل","البزنس",
];

function detectQty(words: string[]): number | undefined {
  for (const w of words) {
    if (/^\d+$/.test(w)) return parseInt(w, 10);
    if (NUM_WORDS[w] !== undefined) return NUM_WORDS[w];
  }
  return undefined;
}

function extractSubject(words: string[]): string {
  return words
    .filter((w) => !/^\d+$/.test(w) && NUM_WORDS[w] === undefined && !STOP.includes(w))
    .join(" ")
    .trim();
}

export function parseQuery(text: string): ParsedQuery {
  const raw = text || "";
  const t = normAr(raw);
  const words = t.split(" ").filter(Boolean);
  const has = (...keys: string[]) => keys.some((k) => t.includes(normAr(k)));

  // order matters: actions (write) before reads
  if (has("بيع", "بعلي", "sell", "اعمل بيع", "sale")) {
    return { intent: "CREATE_SALE", qty: detectQty(words) ?? 1, subject: extractSubject(words), raw };
  }
  if (has("زيد", "زود", "ضيف", "اضف", "أضف", "add stock", "حدث المخزون", "update inventory")) {
    return { intent: "UPDATE_INVENTORY", qty: detectQty(words), subject: extractSubject(words), raw };
  }
  if (has("اكثر منتج", "أكثر مبيع", "best seller", "top product", "اكثر مبيعا")) {
    return { intent: "TOP_PRODUCTS", range: detectRange(t), raw };
  }
  if (has("ربح", "الارباح", "profit", "كم ربحت")) {
    return { intent: "GET_PROFIT", range: detectRange(t), raw };
  }
  if (has("تحليل", "حلل", "analyze", "تقرير", "report", "كيف الشغل", "كيف البزنس")) {
    return { intent: "ANALYZE_BUSINESS", raw };
  }
  if (has("مبيعات", "بعنا", "sales", "كم بعنا", "كم البيع")) {
    return { intent: "GET_SALES", range: detectRange(t), raw };
  }
  if (has("مخزون", "stock", "inventory", "كمية", "عندي قديش", "كم باقي")) {
    return { intent: "GET_INVENTORY", subject: extractSubject(words), raw };
  }
  return { intent: "UNKNOWN", subject: extractSubject(words), raw };
}

// Used for image input mode coming from the UI (invoice vs shelf)
export function parseImageMode(mode: string, ocrText: string): ParsedQuery {
  if (mode === "shelf") return { intent: "ANALYZE_SHELF", raw: ocrText };
  return { intent: "PARSE_INVOICE", raw: ocrText };
}

// Extract "name qty" pairs from invoice OCR text (rule-based, line by line)
export function parseInvoiceLines(ocrText: string): { name: string; qty: number }[] {
  const out: { name: string; qty: number }[] = [];
  for (const line of (ocrText || "").split(/\n+/)) {
    const clean = line.trim();
    if (!clean) continue;
    // look for a trailing or leading number = qty, rest = name
    const m = clean.match(/(.+?)[\s:x×*-]+(\d+(?:\.\d+)?)\s*$/) || clean.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!m) continue;
    let name: string, qty: number;
    if (/^\d/.test(m[1])) { qty = parseFloat(m[1]); name = m[2]; }
    else { name = m[1]; qty = parseFloat(m[2]); }
    name = name.replace(/[^\p{L}\s]/gu, " ").trim();
    if (name.length >= 2 && qty > 0) out.push({ name, qty });
  }
  return out;
}
