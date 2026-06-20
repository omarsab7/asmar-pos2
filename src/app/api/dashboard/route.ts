import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfitToday, getSalesToday, getTopProductsToday, getLowStock } from "@/lib/analytics";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [sales, profit, top, low] = await Promise.all([
    getSalesToday(), getProfitToday(), getTopProductsToday(5), getLowStock(),
  ]);
  return NextResponse.json({ sales, profit, top, low });
}
