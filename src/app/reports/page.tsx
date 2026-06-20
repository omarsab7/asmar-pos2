"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => "$" + (Math.round((n || 0) * 100) / 100).toFixed(2);
const PRESETS = [["today", "اليوم"], ["week", "آخر ٧ أيام"], ["month", "هالشهر"], ["year", "هالسنة"]];

export default function Reports() {
  const [range, setRange] = useState("month");
  const [d, setD] = useState<any>(null);

  async function load(r: string) { const res = await fetch(`/api/reports?range=${r}`); setD(await res.json()); }
  useEffect(() => { load(range); }, [range]);

  const maxRev = Math.max(1, ...(d?.daily || []).map((x: any) => x.revenue));

  return (
    <Shell>
      <h1 className="mb-4 text-2xl font-bold text-gold">التقارير</h1>

      <div className="-mx-3 mb-4 flex gap-2 overflow-x-auto px-3">
        {PRESETS.map(([k, l]) => (
          <button key={k} onClick={() => setRange(k)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${range === k ? "bg-gradient-to-br from-caramel to-gold font-semibold text-[#1a1410]" : "border border-caramel/25 text-cream/70"}`}>{l}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["إجمالي المبيعات", money(d?.stats?.revenue), "💵"], ["الربح الصافي", money(d?.stats?.netProfit), "💰"],
          ["عدد الفواتير", d?.stats?.count ?? "—", "🧾"], ["المصاريف", money(d?.stats?.expenses), "🧾"]].map(([l, v, i]) => (
          <div key={l as string} className="card p-4"><div className="text-2xl">{i}</div>
            <div className="mt-2 text-xl font-bold text-gold">{v as any}</div><div className="text-sm text-cream/60">{l}</div></div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 font-semibold text-cream">📅 المبيعات يوم بيوم</div>
          {d?.daily?.length ? d.daily.map((x: any) => (
            <div key={x.date} className="py-1.5">
              <div className="flex justify-between text-sm"><span className="text-cream/70">{x.date}</span>
                <span className="text-gold">{money(x.revenue)} <span className="text-cream/40">· ربح {money(x.profit)}</span></span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-card">
                <div className="h-full rounded-full bg-gradient-to-l from-caramel to-gold" style={{ width: `${(x.revenue / maxRev) * 100}%` }} /></div>
            </div>
          )) : <div className="text-sm text-cream/50">لا بيانات بهالمدة.</div>}
        </div>
        <div className="card p-4">
          <div className="mb-3 font-semibold text-cream">🏆 الأكثر مبيعاً</div>
          {d?.top?.length ? d.top.map((t: any, i: number) => (
            <div key={i} className="flex justify-between border-b border-caramel/10 py-2 text-sm">
              <span>{i + 1}. {t.name}</span><span className="text-gold">{t.qty} · {money(t.revenue)}</span></div>
          )) : <div className="text-sm text-cream/50">لا مبيعات.</div>}
        </div>
      </div>
    </Shell>
  );
}
