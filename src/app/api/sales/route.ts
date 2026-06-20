import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSale } from "@/lib/analytics";

export async function GET() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" }, take: 100,
    include: { items: { include: { product: true } }, customer: true },
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
    paid: b.paid,
    paymentMethod: b.paymentMethod || "cash",
  });
  return NextResponse.json({ sale, warnings });
}

// تسجيل دفعة على فاتورة موجودة (مثلاً زبون رجع دفع باقي الدين)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const sale = await prisma.sale.findUnique({ where: { id: b.id } });
  if (!sale) return NextResponse.json({ error: "not found" }, { status: 404 });
  // b.addPaid = مبلغ يضاف للمدفوع ، أو b.paid = تعيين المدفوع مباشرة
  let paid = b.addPaid !== undefined ? sale.paid + Number(b.addPaid) : Number(b.paid);
  paid = Math.max(0, Math.min(paid, sale.total));
  const paymentStatus = paid >= sale.total ? "paid" : paid <= 0 ? "unpaid" : "partial";
  const updated = await prisma.sale.update({ where: { id: b.id }, data: { paid, paymentStatus } });
  return NextResponse.json({ sale: updated });
}
