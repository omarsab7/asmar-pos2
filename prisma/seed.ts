import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const cashierPass = await bcrypt.hash("cashier123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@asmar.coffee" }, update: {},
    create: { name: "Bachar Hawli", email: "admin@asmar.coffee", password: adminPass, role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "cashier@asmar.coffee" }, update: {},
    create: { name: "Cashier", email: "cashier@asmar.coffee", password: cashierPass, role: "CASHIER" },
  });

  const ingDefs = [
    { name: "Coffee Beans", nameAr: "حبوب قهوة", unit: "g", stock: 5000, minStock: 1000, costPerUnit: 0.05 },
    { name: "Milk", nameAr: "حليب", unit: "ml", stock: 20000, minStock: 4000, costPerUnit: 0.002 },
    { name: "Sugar", nameAr: "سكر", unit: "g", stock: 8000, minStock: 1500, costPerUnit: 0.001 },
    { name: "Chocolate", nameAr: "شوكولا", unit: "g", stock: 3000, minStock: 600, costPerUnit: 0.02 },
    { name: "Cups", nameAr: "كاسات", unit: "pcs", stock: 500, minStock: 120, costPerUnit: 0.10 },
    { name: "Ice", nameAr: "تلج", unit: "g", stock: 100000, minStock: 8000, costPerUnit: 0.0001 },
    { name: "Lemon", nameAr: "ليمون", unit: "pcs", stock: 90, minStock: 25, costPerUnit: 0.30 },
    { name: "Mint", nameAr: "نعنع", unit: "g", stock: 800, minStock: 200, costPerUnit: 0.01 },
  ];
  const ing: Record<string, string> = {};
  for (const d of ingDefs) {
    const row = await prisma.ingredient.upsert({ where: { name: d.name }, update: {}, create: d });
    ing[d.name] = row.id;
  }

  const prodDefs: { name: string; nameAr: string; category: string; price: number; recipe: [string, number][] }[] = [
    { name: "Cappuccino", nameAr: "كابتشينو", category: "قهوة", price: 2.0, recipe: [["Coffee Beans", 18], ["Milk", 150], ["Cups", 1]] },
    { name: "Nescafe", nameAr: "نسكافيه", category: "قهوة", price: 1.5, recipe: [["Coffee Beans", 10], ["Milk", 100], ["Sugar", 6], ["Cups", 1]] },
    { name: "Latte", nameAr: "لاتيه", category: "قهوة", price: 2.5, recipe: [["Coffee Beans", 18], ["Milk", 220], ["Cups", 1]] },
    { name: "Ice Coffee", nameAr: "آيس كوفي", category: "بارد", price: 2.5, recipe: [["Coffee Beans", 18], ["Milk", 120], ["Ice", 200], ["Cups", 1]] },
    { name: "Hot Chocolate", nameAr: "شوكولا ساخن", category: "ساخن", price: 2.2, recipe: [["Chocolate", 25], ["Milk", 200], ["Cups", 1]] },
    { name: "Lemonade", nameAr: "عصير ليمون", category: "بارد", price: 2.0, recipe: [["Lemon", 2], ["Sugar", 20], ["Ice", 150], ["Mint", 5], ["Cups", 1]] },
  ];
  for (const p of prodDefs) {
    const existing = await prisma.product.findUnique({ where: { name: p.name } });
    if (existing) continue;
    await prisma.product.create({ data: {
      name: p.name, nameAr: p.nameAr, category: p.category, price: p.price,
      recipe: { create: p.recipe.map(([n, qty]) => ({ ingredientId: ing[n], qty })) },
    }});
  }

  // customers (idempotent by phone)
  const c1 = await prisma.customer.upsert({ where: { phone: "70111222" }, update: {}, create: { name: "أبو علي", phone: "70111222", note: "زبون يومي" } });
  await prisma.customer.upsert({ where: { phone: "76333444" }, update: {}, create: { name: "سارة", phone: "76333444" } });

  // sample sales/expenses only on a fresh DB
  const saleCount = await prisma.sale.count();
  if (saleCount === 0) {
    async function rec(items: { name: string; qty: number }[], customerId?: string) {
      let total = 0, cogs = 0; const saleItems: any[] = [];
      for (const it of items) {
        const product = await prisma.product.findFirst({ where: { name: it.name }, include: { recipe: { include: { ingredient: true } } } });
        if (!product) continue;
        total += product.price * it.qty;
        for (const r of product.recipe) {
          cogs += r.qty * r.ingredient.costPerUnit * it.qty;
          await prisma.ingredient.update({ where: { id: r.ingredientId }, data: { stock: { decrement: r.qty * it.qty } } });
        }
        saleItems.push({ productId: product.id, qty: it.qty, price: product.price });
      }
      await prisma.sale.create({ data: { total, cogs, userId: admin.id, customerId, items: { create: saleItems } } });
    }
    await rec([{ name: "Cappuccino", qty: 3 }, { name: "Lemonade", qty: 2 }], c1.id);
    await rec([{ name: "Ice Coffee", qty: 2 }, { name: "Nescafe", qty: 1 }]);
    await prisma.expense.createMany({ data: [{ label: "كهرباء", amount: 15 }, { label: "صيانة", amount: 10 }] });
  }
  console.log("✅ Seed done (idempotent). Login: admin@asmar.coffee / admin123");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
