import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

// كل الأسعار بالليرة اللبنانية (ل.ل). التكلفة = سعر الحبة من فاتورة الشراء (0 = غير معروفة، عبّيها من المخزون).
// هذا الـseed آمن للتكرار: بيحدّث المنيو والأسعار والتكاليف بدون ما يمسح المبيعات أو الزباين، وبيحافظ على كميات المخزون اللي عدّلتها بإيدك.

type Ing = { name: string; nameAr: string; unit: string; stock: number; min: number; cost: number };
type Prod = { name: string; nameAr: string; category: string; price: number; recipe: { ing: string; qty: number }[] };

const ingredients: Ing[] = [
  { name: "Cup", nameAr: "كاسة", unit: "كاسة", stock: 500, min: 100, cost: 0 },
  { name: "Nescafe Sachet", nameAr: "ظرف نسكافيه", unit: "ظرف", stock: 30, min: 6, cost: 15000 },
  { name: "Capuchino Sachet", nameAr: "ظرف كابتشينو", unit: "ظرف", stock: 22, min: 6, cost: 17714 },
];

// الجاهز: [name, nameAr, category, price, cost, stock, min, unit]
const ready: [string, string, string, number, number, number, number, string][] = [
  ["Xxl", "إكس إكس إل", "بارد", 70000, 39375, 24, 6, "حبة"],
  ["Mrs jus", "مسز جوس", "بارد", 30000, 16650, 24, 6, "حبة"],
  ["Bonjus milk shake", "بونجوس ميلك شيك", "بارد", 50000, 0, 24, 6, "حبة"],
  ["Xtra", "إكسترا", "بارد", 50000, 32437, 24, 6, "حبة"],
  ["Pepsi", "ببسي", "بارد", 40000, 17512, 24, 6, "حبة"],
  ["Mogo mogo", "موغو موغو", "بارد", 100000, 33750, 24, 6, "حبة"],
  ["Ice coffee", "آيس كوفي", "قهوة", 80000, 0, 20, 5, "حبة"],
  ["Indomi", "إندومي", "سناك", 70000, 0, 24, 6, "حبة"],
  ["Browni", "براوني ريماس", "سناك", 50000, 25012, 24, 6, "حبة"],
  ["Rimas", "ريماس محاشي", "سناك", 40000, 15638, 24, 6, "حبة"],
  ["Chips Dolsi", "شيبس دولسي", "سناك", 50000, 24834, 32, 6, "حبة"],
  ["Chips Ringo", "شيبس رينغو", "سناك", 40000, 0, 24, 6, "حبة"],
  ["Chips sghir", "شيبس صغير", "سناك", 20000, 0, 24, 6, "حبة"],
  ["Dolsi kbir", "دولسي كبير", "سناك", 100000, 65644, 16, 4, "حبة"],
  ["Karkesh kbir", "قرقش كبير", "سناك", 100000, 31650, 12, 4, "حبة"],
  ["Biskrem", "بيسكريم", "سناك", 100000, 0, 24, 6, "حبة"],
  ["Mars", "مارس", "سناك", 80000, 0, 24, 6, "حبة"],
  ["Metro", "مترو", "سناك", 40000, 0, 24, 6, "حبة"],
  ["Albeni", "ألبيني", "سناك", 40000, 0, 24, 6, "حبة"],
  ["Chco prine", "تشوكو برينس", "سناك", 50000, 0, 24, 6, "حبة"],
  ["Popinz", "بوبينز", "سناك", 20000, 0, 24, 6, "حبة"],
  ["Marlboro", "مارلبورو أحمر", "دخان", 200000, 180000, 10, 3, "علبة"],
  ["Winston", "وينستون لايت", "دخان", 180000, 151830, 10, 3, "علبة"],
  ["Kent", "كنت", "دخان", 180000, 0, 10, 3, "علبة"],
  ["Davidoff", "دافيدوف", "دخان", 170000, 0, 10, 3, "علبة"],
  ["Cedars", "سيدرز", "دخان", 90000, 75870, 10, 3, "علبة"],
  ["Arghileh Edara", "أرغيلة إدارة", "أرغيلة", 400000, 0, 999, 0, "أرغيلة"],
  ["Arghileh Khalta", "أرغيلة خلطة", "أرغيلة", 350000, 0, 999, 0, "أرغيلة"],
  ["Arghileh Hamod Naana", "أرغيلة حامض ونعنع", "أرغيلة", 350000, 0, 999, 0, "أرغيلة"],
  ["Tabseh", "تبسة مخلوطة", "أرغيلة", 50000, 0, 99, 6, "تبسة"],
  ["Buza Sandwich", "ساندويش بوظة", "بوظة", 50000, 0, 99, 10, "حبة"],
  ["Corne Sghir", "كورنيه صغير", "بوظة", 50000, 0, 99, 10, "حبة"],
  ["Corne Kbir", "كورنيه كبير", "بوظة", 100000, 0, 99, 10, "حبة"],
  ["Clasico Sghir", "كلاسيكو صغير", "بوظة", 80000, 0, 99, 10, "حبة"],
  ["Clasico Kbir", "كلاسيكو كبير", "بوظة", 100000, 0, 99, 10, "حبة"],
  ["Boule Buza", "تعباية بوظة", "بوظة", 25000, 0, 999, 0, "تعباية"],
];

const products: Prod[] = [
  { name: "Nescafe", nameAr: "نسكافيه", category: "قهوة", price: 60000, recipe: [{ ing: "Nescafe Sachet", qty: 1 }, { ing: "Cup", qty: 1 }] },
  { name: "Capuchino", nameAr: "كابتشينو", category: "قهوة", price: 60000, recipe: [{ ing: "Capuchino Sachet", qty: 1 }, { ing: "Cup", qty: 1 }] },
];

for (const [name, nameAr, category, price, cost, stock, min, unit] of ready) {
  ingredients.push({ name, nameAr, unit, stock, min, cost });
  products.push({ name, nameAr, category, price, recipe: [{ ing: name, qty: 1 }] });
}

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const cashierPass = await bcrypt.hash("cashier123", 10);
  await prisma.user.upsert({ where: { email: "admin@asmar.coffee" }, update: {},
    create: { name: "Bachar Hawli", email: "admin@asmar.coffee", password: adminPass, role: "ADMIN" } });
  await prisma.user.upsert({ where: { email: "cashier@asmar.coffee" }, update: {},
    create: { name: "Cashier", email: "cashier@asmar.coffee", password: cashierPass, role: "CASHIER" } });

  // 0) تنظيف لمرة واحدة فقط: إذا لسا موجودة بيانات تجريبية قديمة (مكوّن "Coffee Beans")،
  //    امسح المبيعات التجريبية بالدولار. بعد أول نشر بيختفي هالمكوّن فما بترجع تنمسح أي بيانات حقيقية.
  const oldTest = await prisma.ingredient.findFirst({ where: { name: "Coffee Beans" } });
  if (oldTest) {
    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.aIQueryLog.deleteMany({});
    await prisma.customer.deleteMany({});
    console.log("🧹 مسح البيانات التجريبية القديمة (مرة واحدة).");
  }

  // 1) المكوّنات: حدّث التكلفة/الاسم/الوحدة، واحفظ الكمية الحالية (لا تلمس stock عند التحديث)
  const ingId: Record<string, string> = {};
  for (const i of ingredients) {
    const row = await prisma.ingredient.upsert({
      where: { name: i.name },
      update: { nameAr: i.nameAr, unit: i.unit, costPerUnit: i.cost, minStock: i.min },
      create: { name: i.name, nameAr: i.nameAr, unit: i.unit, stock: i.stock, minStock: i.min, costPerUnit: i.cost },
    });
    ingId[i.name] = row.id;
  }

  // 2) المنتجات: حدّث السعر/التصنيف وأعد بناء الوصفة (الوصفة غير مرتبطة بالمبيعات فآمن حذفها)
  for (const p of products) {
    const prod = await prisma.product.upsert({
      where: { name: p.name },
      update: { nameAr: p.nameAr, category: p.category, price: p.price, active: true },
      create: { name: p.name, nameAr: p.nameAr, category: p.category, price: p.price, active: true },
    });
    await prisma.recipeItem.deleteMany({ where: { productId: prod.id } });
    await prisma.recipeItem.createMany({ data: p.recipe.map((r) => ({ productId: prod.id, ingredientId: ingId[r.ing], qty: r.qty })) });
  }

  // 3) تنظيف البيانات التجريبية القديمة بدون مسّ المبيعات:
  const keepProd = new Set(products.map((p) => p.name));
  for (const old of await prisma.product.findMany()) {
    if (keepProd.has(old.name)) continue;
    const used = await prisma.saleItem.count({ where: { productId: old.id } });
    if (used > 0) {
      await prisma.product.update({ where: { id: old.id }, data: { active: false } }); // عليه مبيعات: نخفيه فقط
    } else {
      await prisma.recipeItem.deleteMany({ where: { productId: old.id } });
      await prisma.product.delete({ where: { id: old.id } });
    }
  }
  const keepIng = new Set(ingredients.map((i) => i.name));
  for (const old of await prisma.ingredient.findMany()) {
    if (keepIng.has(old.name)) continue;
    await prisma.ingredient.delete({ where: { id: old.id } }); // يحذف حركاته ووصفاته (cascade)
  }

  const count = await prisma.product.count({ where: { active: true } });
  console.log(`✅ Seed done. ${count} منتج فعّال بالليرة. الدخول: admin@asmar.coffee / admin123`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
