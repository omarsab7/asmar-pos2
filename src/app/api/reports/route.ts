import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rangeFor, getStats, getDailyBreakdown, getTopProducts } from "@/lib/analytics";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const preset = url.searchParams.get("range") || "today";
  let range = rangeFor(preset);
  const from = url.searchParams.get("from"), to = url.searchParams.get("to");
  if (preset === "custom" && from && to) {
    const f = new Date(from); f.setHours(0, 0, 0, 0);
    const t = new Date(to); t.setHours(23, 59, 59, 999);
    range = { from: f, to: t };
  }
  const [stats, daily, top] = await Promise.all([getStats(range), getDailyBreakdown(range), getTopProducts(range, 8)]);
  return NextResponse.json({ preset, stats, daily, top });
}
