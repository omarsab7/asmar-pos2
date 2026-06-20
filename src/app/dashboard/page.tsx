"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => "$" + (Math.round((n || 0) * 100) / 100).toFixed(2);

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  async function load() { const r = await fetch("/api/dashboard"); setD(await r.json()); }
  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("asmar:refresh", h);
    return () => window.removeEventListener("asmar:refresh", h);
  }, []);

  const cards = [
    { label: "إيراد اليوم", val: money(d?.profit?.revenue), icon: "💵" },
    { label: "الربح الصافي", val: money(d?.profit?.netProfit), icon: "💰" },
    { label: "عدد الفواتير", val: d?.sales?.count ?? "—", icon: "🧾" },
    { label: "مخزون منخفض", val: d?.low?.length ?? "—", icon: "⚠️" },
  ];

  return (
    <Shell>
      <h1 className="mb-5 text-2xl font-bold text-gold">لوحة التحكم</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-2 text-2xl font-bold text-gold">{c.val}</div>
            <div className="text-sm text-cream/60">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 font-semibold text-cream">🏆 الأكثر مبيعاً اليوم</div>
          {d?.top?.length ? d.top.map((t: any, i: number) => {
            const max = Math.max(...d.top.map((x: any) => x.qty));
            return (
              <div key={i} className="py-1.5">
                <div className="flex justify-between text-sm"><span>{i + 1}. {t.nameAr}</span><span className="text-gold">{t.qty} · {money(t.revenue)}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-card">
                  <div className="h-full rounded-full bg-gradient-to-l from-caramel to-gold" style={{ width: `${(t.qty / max) * 100}%` }} />
                </div>
              </div>
            );
          }) : <div className="text-sm text-cream/50">لا مبيعات بعد.</div>}
        </div>
        <div className="card p-4">
          <div className="mb-3 font-semibold text-cream">⚠️ مخزون منخفض</div>
          {d?.low?.length ? d.low.map((l: any) => (
            <div key={l.id} className="flex justify-between border-b border-caramel/10 py-2 text-sm">
              <span>{l.nameAr}</span><span className="text-red-400">{l.stock}{l.unit} / حد {l.minStock}{l.unit}</span>
            </div>
          )) : <div className="text-sm text-cream/50">كل المخزون تمام ✅</div>}
        </div>
      </div>
    </Shell>
  );
}
