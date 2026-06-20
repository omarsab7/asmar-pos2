import { prisma } from "@/lib/db";
import { startOfToday, normAr } from "@/lib/utils";

export type Range = { from: Date; to: Date };

export function rangeFor(preset: string): Range {
  const now = new Date();
  const to = new Date(now); to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  switch (preset) {
    case "today": from.setHours(0, 0, 0, 0); break;
    case "week": from.setDate(now.getDate() - 6); from.setHours(0, 0, 0, 0); break;
    case "month": from.setDate(1); from.setHours(0, 0, 0, 0); break;
    case "year": from.setMonth(0, 1); from.setHours(0, 0, 0, 0); break;
    default: from.setHours(0, 0, 0, 0);
  }
  return { from, to };
}

export async function getStats({ from, to }: Range) {
  const sales = await prisma.sale.findMany({ where: { createdAt: { gte: from, lte: to } } });
  const expenses = await prisma.expense.findMany({ where: { createdAt: { gte: from, lte: to } } });
  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const cogs = sales.reduce((s, x) => s + x.cogs, 0);
  const exp = expenses.reduce((s, x) => s + x.amount, 0);
  return { count: sales.length, revenue, cogs, expenses: exp, netProfit: revenue - cogs - exp };
}

export async function getDailyBreakdown({ from, to }: Range) {
  const sales = await prisma.sale.findMany({ where: { createdAt: { gte: from, lte: to } }, orderBy: { createdAt: "asc" } });
  const map = new Map<string, { date: string; revenue: number; profit: number; count: number }>();
  for (const s of sales) {
    const key = s.createdAt.toISOString().slice(0, 10);
    const cur = map.get(key) ?? { date: key, revenue: 0, profit: 0, count: 0 };
    cur.revenue += s.total; cur.profit += s.total - s.cogs; cur.count += 1;
    map.set(key, cur);
  }
  return [...map.values()];
}

export async function getTopProducts(range: Range, limit = 5) {
  const items = await prisma.saleItem.findMany({
    where: { sale: { createdAt: { gte: range.from, lte: range.to } } },
    include: { product: true },
  });
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const it of items) {
    const cur = map.get(it.productId) ?? { name: it.product.nameAr, qty: 0, revenue: 0 };
    cur.qty += it.qty; cur.revenue += it.qty * it.price;
    map.set(it.productId, cur);
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
}

// ---- today shortcuts (used by dashboard) ----
const today = (): Range => ({ from: startOfToday(), to: new Date() });
export const getSalesToday = () => getStats(today());
export const getProfitToday = () => getStats(today());
export const getTopProductsToday = (n = 5) => getTopProducts(today(), n);

export async function getLowStock() {
  const ings = await prisma.ingredient.findMany();
  return ings.filter((i) => i.stock <= i.minStock)
    .map((i) => ({ id: i.id, nameAr: i.nameAr, stock: i.stock, minStock: i.minStock, unit: i.unit }));
}

export async function findProductByText(text: string) {
  const q = normAr(text); if (!q) return null;
  const products = await prisma.product.findMany({ where: { active: true } });
  return products.find((p) => normAr(p.nameAr) === q || normAr(p.name) === q)
    || products.find((p) => q.includes(normAr(p.nameAr)) || normAr(p.nameAr).includes(q))
    || products.find((p) => q.includes(normAr(p.name)) || normAr(p.name).includes(q)) || null;
}

export async function findIngredientByText(text: string) {
  const q = normAr(text); if (!q) return null;
  const ings = await prisma.ingredient.findMany();
  return ings.find((i) => normAr(i.nameAr) === q || normAr(i.name) === q)
    || ings.find((i) => q.includes(normAr(i.nameAr)) || normAr(i.nameAr).includes(q))
    || ings.find((i) => q.includes(normAr(i.name)) || normAr(i.name).includes(q)) || null;
}

export async function createSale(
  lines: { productId: string; qty: number }[],
  opts: { discount?: number; userId?: string; paymentMethod?: string; customerId?: string } = {}
) {
  const discount = opts.discount ?? 0;
  let total = 0, cogs = 0;
  const saleItems: { productId: string; qty: number; price: number }[] = [];
  const warnings: string[] = [];
  for (const ln of lines) {
    const product = await prisma.product.findUnique({ where: { id: ln.productId }, include: { recipe: { include: { ingredient: true } } } });
    if (!product) continue;
    total += product.price * ln.qty;
    saleItems.push({ productId: product.id, qty: ln.qty, price: product.price });
    for (const r of product.recipe) {
      cogs += r.qty * r.ingredient.costPerUnit * ln.qty;
      const used = r.qty * ln.qty;
      await prisma.ingredient.update({ where: { id: r.ingredientId }, data: { stock: { decrement: used } } });
      await prisma.inventoryItem.create({ data: { ingredientId: r.ingredientId, change: -used, type: "OUT", reason: `بيع ${product.nameAr}` } });
      const after = await prisma.ingredient.findUnique({ where: { id: r.ingredientId } });
      if (after && after.stock <= after.minStock) warnings.push(`⚠️ ${after.nameAr} وصل لحد النقص (${after.stock}${after.unit})`);
    }
  }
  total = Math.max(0, total - discount);
  const sale = await prisma.sale.create({
    data: { total, discount, cogs, userId: opts.userId, customerId: opts.customerId, paymentMethod: opts.paymentMethod ?? "cash", items: { create: saleItems } },
    include: { items: { include: { product: true } } },
  });
  return { sale, warnings: [...new Set(warnings)] };
}
