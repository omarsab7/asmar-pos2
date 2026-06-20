import { prisma } from "@/lib/db";

export async function listIngredients() {
  return prisma.ingredient.findMany({ orderBy: { nameAr: "asc" } });
}

export async function adjustStock(id: string, change: number, reason = "تعديل") {
  const ingredient = await prisma.ingredient.update({ where: { id }, data: { stock: { increment: change } } });
  await prisma.inventoryItem.create({ data: { ingredientId: id, change, type: change >= 0 ? "IN" : "OUT", reason } });
  return ingredient;
}

export async function lowStock() {
  const ings = await prisma.ingredient.findMany();
  return ings.filter((i) => i.stock <= i.minStock);
}
