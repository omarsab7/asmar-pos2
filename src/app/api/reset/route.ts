import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// تصفير الحساب: يمسح المبيعات والفواتير فقط. المنيو والمخزون والزباين تبقى.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "admin only" }, { status: 403 });
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.aIQueryLog.deleteMany({});
  return NextResponse.json({ ok: true });
}
