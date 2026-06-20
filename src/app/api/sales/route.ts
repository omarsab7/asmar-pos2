import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSale } from "@/lib/analytics";

export async function GET() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" }, take: 20,
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json({ sales });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const lines = (b.items || []).map((i: any) => ({ productId: i.productId, qty: Number(i.qty) || 1 }));
  if (!lines.length) return NextResponse.json({ error: "no items" }, { status: 400 });
  const { sale, warnings } = await createSale(lines, {
    discount: Number(b.discount) || 0,
    userId: (session.user as any).id,
    customerId: b.customerId || undefined,
    paymentMethod: b.paymentMethod || "cash",
  });
  return NextResponse.json({ sale, warnings });
}
