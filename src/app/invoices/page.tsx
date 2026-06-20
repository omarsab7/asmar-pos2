"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => Math.round(n || 0).toLocaleString("en-US") + " ل.ل";

export default function Invoices() {
  const [sales, setSales] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold text-gold">الفواتير</h1>
      <p className="mb-4 text-xs text-cream/50">كل البيعات مع تفاصيلها. اضغط فاتورة لتشوف الأصناف.</p>

      {loading && <div className="text-sm text-cream/50">عم نحمّل...</div>}
      {!loading && !sales.length && <div className="text-sm text-cream/50">ما في فواتير بعد.</div>}

      <div className="space-y-2">
        {sales.map((s) => (
          <div key={s.id} className="card overflow-hidden">
            <button onClick={() => setOpen(open === s.id ? null : s.id)} className="flex w-full items-center justify-between p-3 text-right">
              <div>
                <div className="text-sm text-cream">{fmt(s.createdAt)}</div>
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
              </div>
            )}
          </div>
        ))}
      </div>
    </Shell>
  );
}
