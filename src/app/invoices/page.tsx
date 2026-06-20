"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => Math.round(n || 0).toLocaleString("en-US") + " ل.ل";

export default function Invoices() {
  const [sales, setSales] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"الكل" | "دين">("الكل");
  const [payFor, setPayFor] = useState<any>(null);
  const [payAmt, setPayAmt] = useState(0);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/sales"); const j = await r.json();
    setSales(j.sales || []); setLoading(false);
  }
  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("asmar:refresh", h);
    return () => window.removeEventListener("asmar:refresh", h);
  }, []);

  const fmt = (d: string) => new Date(d).toLocaleString("ar", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  async function recordPayment() {
    await fetch("/api/sales", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: payFor.id, addPaid: payAmt }) });
    setPayFor(null); setPayAmt(0); load();
  }

  let shown = sales;
  if (filter === "دين") shown = shown.filter((s) => s.paymentStatus !== "paid");
  if (q.trim()) {
    const t = q.trim().toLowerCase();
    shown = shown.filter((s) =>
      (s.customer?.name || "").toLowerCase().includes(t) ||
      s.items.some((it: any) => (it.product?.nameAr || "").toLowerCase().includes(t)) ||
      money(s.total).includes(t)
    );
  }

  const totalDebt = sales.reduce((sum, s) => sum + Math.max(0, s.total - (s.paid || 0)), 0);

  const badge = (s: any) => {
    if (s.paymentStatus === "paid") return <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">مدفوع</span>;
    if (s.paymentStatus === "unpaid") return <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-xs text-red-400">دين كامل</span>;
    return <span className="rounded-full bg-caramel/20 px-2 py-0.5 text-xs text-gold">باقي {money(s.total - s.paid)}</span>;
  };

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold text-gold">الفواتير</h1>
      <p className="mb-3 text-xs text-cream/50">كل البيعات مع حالة الدفع. اضغط فاتورة لتشوف الأصناف وتسجّل دفعة.</p>

      {totalDebt > 0 && (
        <div className="card mb-3 flex items-center justify-between border-r-4 border-red-500 p-3">
          <span className="text-sm text-cream/70">إجمالي الديون على الزباين</span>
          <span className="text-lg font-bold text-red-400">{money(totalDebt)}</span>
        </div>
      )}

      <input className="input mb-2" placeholder="🔍 دوّر باسم زبون أو صنف أو مبلغ..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mb-4 flex gap-2">
        <button onClick={() => setFilter("الكل")} className={`rounded-full px-4 py-1.5 text-sm ${filter === "الكل" ? "bg-gradient-to-br from-caramel to-gold font-semibold text-[#1a1410]" : "border border-caramel/25 text-cream/70"}`}>الكل</button>
        <button onClick={() => setFilter("دين")} className={`rounded-full px-4 py-1.5 text-sm ${filter === "دين" ? "bg-red-600 font-semibold text-white" : "border border-caramel/25 text-cream/70"}`}>الديون فقط</button>
      </div>

      {loading && <div className="text-sm text-cream/50">عم نحمّل...</div>}
      {!loading && !shown.length && <div className="text-sm text-cream/50">ما في فواتير.</div>}

      <div className="space-y-2">
        {shown.map((s) => (
          <div key={s.id} className="card overflow-hidden">
            <button onClick={() => setOpen(open === s.id ? null : s.id)} className="flex w-full items-center justify-between p-3 text-right">
              <div>
                <div className="flex items-center gap-2 text-sm text-cream">{fmt(s.createdAt)} {badge(s)}</div>
                <div className="text-xs text-cream/50">{s.items.length} صنف{s.customer ? ` · ${s.customer.name}` : ""}</div>
              </div>
              <div className="text-left">
                <div className="font-bold text-gold">{money(s.total)}</div>
                <div className="text-xs text-cream/40">{open === s.id ? "▲" : "▼"}</div>
              </div>
            </button>
            {open === s.id && (
              <div className="border-t border-caramel/15 bg-espresso/50 p-3">
                {s.items.map((it: any) => (
                  <div key={it.id} className="flex justify-between py-1 text-sm">
                    <span className="text-cream/80">{it.product?.nameAr || "—"} × {it.qty}</span>
                    <span className="text-cream/60">{money(it.price * it.qty)}</span>
                  </div>
                ))}
                {s.discount > 0 && <div className="flex justify-between py-1 text-sm text-cream/50"><span>خصم</span><span>- {money(s.discount)}</span></div>}
                <div className="mt-2 flex justify-between border-t border-caramel/10 pt-2 text-sm font-bold"><span>المجموع</span><span className="text-gold">{money(s.total)}</span></div>
                <div className="flex justify-between py-1 text-sm"><span className="text-cream/60">مدفوع</span><span className="text-green-400">{money(s.paid)}</span></div>
                {s.total - s.paid > 0 && (
                  <>
                    <div className="flex justify-between py-1 text-sm"><span className="text-cream/60">باقي دين</span><span className="text-red-400">{money(s.total - s.paid)}</span></div>
                    <button onClick={() => { setPayFor(s); setPayAmt(s.total - s.paid); }} className="btn btn-gold mt-2 w-full">💰 تسجيل دفعة</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {payFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={() => setPayFor(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-panel p-4 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 font-bold text-gold">تسجيل دفعة</div>
            <div className="mb-3 text-xs text-cream/50">الباقي على الزبون: {money(payFor.total - payFor.paid)}</div>
            <label className="mb-1 block text-sm text-cream/70">كم دفع هلّق؟</label>
            <input className="input mb-3" type="number" value={payAmt} onChange={(e) => setPayAmt(Number(e.target.value))} />
            <div className="flex gap-2">
              <button className="btn btn-gold flex-1" onClick={recordPayment}>حفظ الدفعة</button>
              <button className="flex-1 rounded-xl border border-caramel/30 py-2 text-cream/70" onClick={() => setPayFor(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
