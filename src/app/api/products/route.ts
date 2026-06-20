import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { recipe: { include: { ingredient: true } } },
    orderBy: { category: "asc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const product = await prisma.product.create({
    data: {
      name: b.name, nameAr: b.nameAr, category: b.category ?? "عام", price: Number(b.price) || 0,
      recipe: Array.isArray(b.recipe) ? { create: b.recipe.map((r: any) => ({ ingredientId: r.ingredientId, qty: Number(r.qty) })) } : undefined,
    },
  });
  return NextResponse.json({ product });
}
