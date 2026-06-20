import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const ingredients = await prisma.ingredient.findMany({ orderBy: { nameAr: "asc" } });
  return NextResponse.json({ ingredients });
}

// create a new ingredient
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const ingredient = await prisma.ingredient.create({
    data: {
      name: b.name, nameAr: b.nameAr, unit: b.unit ?? "unit",
      stock: Number(b.stock) || 0, minStock: Number(b.minStock) || 0, costPerUnit: Number(b.costPerUnit) || 0,
    },
  });
  return NextResponse.json({ ingredient });
}

// adjust stock (change can be + or -)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const change = Number(b.change) || 0;
  const ingredient = await prisma.ingredient.update({
    where: { id: b.id },
    data: { stock: { increment: change } },
  });
  await prisma.inventoryItem.create({
    data: { ingredientId: b.id, change, type: change >= 0 ? "IN" : "OUT", reason: b.reason ?? "تعديل يدوي" },
  });
  return NextResponse.json({ ingredient });
}
