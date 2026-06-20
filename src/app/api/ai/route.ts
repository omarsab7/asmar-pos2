import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseQuery, parseImageMode, parseInvoiceLines } from "@/lib/ai-router";
import {
  rangeFor, getStats, getTopProducts, getLowStock,
  findProductByText, findIngredientByText, createSale,
} from "@/lib/analytics";
import { money } from "@/lib/utils";

// action descriptor so the frontend can react (e.g. open POS, refresh inventory)
type AIResult = { intent: string; message: string; action?: string; data?: any };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const type: string = body.type || "text";        // text | voice | image
  const input: string = body.input || "";
  const mode: string = body.mode || "invoice";       // for image: invoice | shelf

  const parsed = type === "image" ? parseImageMode(mode, input) : parseQuery(input);
  const rangeKey = (parsed as any).range || "today";
  const rangeLabel = ({ today: "اليوم", week: "آخر ٧ أيام", month: "هالشهر", year: "هالسنة" } as any)[rangeKey];
  const range = rangeFor(rangeKey);
  let res: AIResult = { intent: parsed.intent, message: "ما فهمت الطلب. جرّب: «كم الربح اليوم؟» أو «اعمل بيع كابتشينو واحد»." };

  switch (parsed.intent) {
    case "GET_SALES": {
      const s = await getStats(range);
      res = { intent: parsed.intent, message: `📊 مبيعات ${rangeLabel}: ${s.count} فاتورة بمجموع ${money(s.revenue)}.`, data: s };
      break;
    }
    case "GET_PROFIT": {
      const p = await getStats(range);
      res = { intent: parsed.intent, message: `💰 ربح ${rangeLabel} الصافي: ${money(p.netProfit)} (إيراد ${money(p.revenue)} − تكلفة ${money(p.cogs)} − مصاريف ${money(p.expenses)}).`, data: p };
      break;
    }
    case "TOP_PRODUCTS": {
      const top = await getTopProducts(range, 5);
      const txt = top.length ? top.map((t, i) => `${i + 1}) ${t.name} — ${t.qty} حبة`).join("\n") : "ما في مبيعات بهالمدة.";
      res = { intent: parsed.intent, message: `🏆 الأكثر مبيعاً (${rangeLabel}):\n${txt}`, data: top };
      break;
    }
    case "GET_INVENTORY": {
      if (parsed.subject) {
        const ing = await findIngredientByText(parsed.subject);
        if (ing) { res = { intent: parsed.intent, message: `📦 ${ing.nameAr}: ${ing.stock}${ing.unit} متوفر (حد النقص ${ing.minStock}${ing.unit}).`, action: "OPEN_INVENTORY", data: ing }; break; }
      }
      const all = await prisma.ingredient.findMany({ orderBy: { nameAr: "asc" } });
      res = { intent: parsed.intent, message: `📦 المخزون: ${all.map((i) => `${i.nameAr} ${i.stock}${i.unit}`).join("، ")}.`, action: "OPEN_INVENTORY", data: all };
      break;
    }
    case "CREATE_SALE": {
      const product = parsed.subject ? await findProductByText(parsed.subject) : null;
      if (!product) { res = { intent: parsed.intent, message: `ما لقيت المنتج "${parsed.subject ?? ""}". جرّب اسم أوضح متل كابتشينو أو لاتيه.` }; break; }
      const qty = parsed.qty ?? 1;
      const { sale, warnings } = await createSale([{ productId: product.id, qty }], { userId: (session.user as any).id });
      res = {
        intent: parsed.intent,
        message: `✅ تمّ بيع ${qty} × ${product.nameAr} بمجموع ${money(sale.total)}.` + (warnings.length ? `\n${warnings.join("\n")}` : ""),
        action: "SALE_DONE", data: { sale, warnings },
      };
      break;
    }
    case "UPDATE_INVENTORY": {
      const ing = parsed.subject ? await findIngredientByText(parsed.subject) : null;
      if (!ing) { res = { intent: parsed.intent, message: `ما لقيت المادة "${parsed.subject ?? ""}".` }; break; }
      const amount = parsed.qty ?? 0;
      if (!amount) { res = { intent: parsed.intent, message: `قدّيش بدك تضيف لـ${ing.nameAr}؟ قول مثلاً «زيد حليب 1000».` }; break; }
      const updated = await prisma.ingredient.update({ where: { id: ing.id }, data: { stock: { increment: amount } } });
      await prisma.inventoryItem.create({ data: { ingredientId: ing.id, change: amount, type: "IN", reason: "AI: تحديث مخزون" } });
      res = { intent: parsed.intent, message: `✅ زدنا ${amount}${ing.unit} على ${ing.nameAr}. الرصيد الجديد ${updated.stock}${ing.unit}.`, action: "OPEN_INVENTORY", data: updated };
      break;
    }
    case "ANALYZE_BUSINESS": {
      const [p, top, low] = await Promise.all([getStats(range), getTopProducts(range, 3), getLowStock()]);
      const topTxt = top.length ? top.map((t) => `${t.name} (${t.qty})`).join("، ") : "لا يوجد";
      const lowTxt = low.length ? low.map((l) => `${l.nameAr} ${l.stock}${l.unit}`).join("، ") : "كله تمام ✅";
      res = { intent: parsed.intent, message: `🧠 تقرير ${rangeLabel}:\n• الربح الصافي: ${money(p.netProfit)}\n• الأكثر مبيعاً: ${topTxt}\n• مخزون منخفض: ${lowTxt}`, data: { p, top, low } };
      break;
    }
    case "PARSE_INVOICE": {
      const lines = parseInvoiceLines(input);
      const applied: string[] = [];
      for (const ln of lines) {
        const ing = await findIngredientByText(ln.name);
        if (!ing) continue;
        await prisma.ingredient.update({ where: { id: ing.id }, data: { stock: { increment: ln.qty } } });
        await prisma.inventoryItem.create({ data: { ingredientId: ing.id, change: ln.qty, type: "IN", reason: "فاتورة (OCR)" } });
        applied.push(`${ing.nameAr} +${ln.qty}${ing.unit}`);
      }
      await prisma.purchase.create({ data: { rawText: input, note: `OCR invoice — ${applied.length} مادة محدّثة` } });
      res = {
        intent: parsed.intent,
        message: applied.length ? `🧾 حدّثت المخزون من الفاتورة:\n${applied.join("\n")}` : "قرأت الفاتورة بس ما طابقت مواد معروفة. تأكد إنّو الأسماء متل أسماء المخزون.",
        action: "OPEN_INVENTORY", data: { lines, applied },
      };
      break;
    }
    case "ANALYZE_SHELF": {
      const low = await getLowStock();
      res = {
        intent: parsed.intent,
        message: low.length ? `📷 حسب المخزون الحالي، في مواد قاربت تخلص:\n${low.map((l) => `⚠️ ${l.nameAr}: ${l.stock}${l.unit}`).join("\n")}` : "📷 المخزون مبيّن منيح، ما في نقص واضح حالياً.",
        action: "OPEN_INVENTORY", data: low,
      };
      break;
    }
  }

  await prisma.aIQueryLog.create({
    data: { input: input.slice(0, 1000), type, intent: parsed.intent, response: res.message.slice(0, 1000), userId: (session.user as any).id },
  });

  return NextResponse.json(res);
}
