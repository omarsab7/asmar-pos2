import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");

  if (id) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { sales: { orderBy: { createdAt: "desc" }, include: { items: { include: { product: true } } } } },
    });
    if (!customer) return NextResponse.json({ error: "not found" }, { status: 404 });
    const totalSpent = customer.sales.reduce((s, x) => s + x.total, 0);
    return NextResponse.json({ customer, totalSpent, visits: customer.sales.length });
  }

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { sales: { select: { total: true } } },
  });
  const list = customers.map((c) => ({
    id: c.id, name: c.name, phone: c.phone, note: c.note,
    visits: c.sales.length, totalSpent: c.sales.reduce((s, x) => s + x.total, 0),
  }));
  return NextResponse.json({ customers: list });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  try {
    const customer = await prisma.customer.create({ data: { name: b.name, phone: b.phone || null, note: b.note || null } });
    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ error: "phone already exists" }, { status: 409 });
  }
}
