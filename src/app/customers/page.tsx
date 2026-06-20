"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => "$" + (Math.round((n || 0) * 100) / 100).toFixed(2);

export default function Customers() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const [open, setOpen] = useState<any>(null);

  async function load() { const r = await fetch("/api/customers"); const j = await r.json(); setList(j.customers || []); }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!form.name) return;
    await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", phone: "", note: "" }); load();
  }
  async function openCustomer(id: string) { const r = await fetch(`/api/customers?id=${id}`); setOpen(await r.json()); }

  return (
    <Shell>
      <h1 className="mb-4 text-2xl font-bold text-gold">الزباين</h1>

      <div className="card mb-4 p-4">
        <div className="mb-2 font-semibold text-cream">➕ زبون جديد</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input className="input" placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="الموبايل (اختياري)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="ملاحظة (اختياري)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <button className="btn btn-gold mt-3" onClick={add}>إضافة</button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <button key={c.id} onClick={() => openCustomer(c.id)} className="card p-4 text-right hover:border-caramel">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-cream">{c.name}</div>
              <div className="text-sm text-gold">{money(c.totalSpent)}</div>
            </div>
            <div className="text-xs text-cream/50">{c.phone || "—"} · {c.visits} زيارة</div>
          </button>
        ))}
        {!list.length && <div className="text-sm text-cream/50">ما في زباين بعد.</div>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={() => setOpen(null)}>
          <div className="max-h-[80svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-panel p-4 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <div className="text-lg font-bold text-gold">{open.customer?.name}</div>
              <button onClick={() => setOpen(null)} className="text-cream/50">✕</button>
            </div>
            <div className="mb-3 text-sm text-cream/60">{open.customer?.phone || "بدون رقم"} · {open.visits} زيارة · صرف {money(open.totalSpent)}</div>
            <div className="mb-2 text-sm font-semibold text-cream">📜 سجلّ الطلبات</div>
            {open.customer?.sales?.length ? open.customer.sales.map((s: any) => (
              <div key={s.id} className="mb-2 rounded-xl bg-card p-3 text-sm">
                <div className="flex justify-between"><span className="text-cream/60">{new Date(s.createdAt).toLocaleString("ar")}</span><span className="text-gold">{money(s.total)}</span></div>
                <div className="text-cream/70">{s.items.map((i: any) => `${i.product.nameAr}×${i.qty}`).join("، ")}</div>
              </div>
            )) : <div className="text-sm text-cream/50">ما في طلبات بعد.</div>}
          </div>
        </div>
      )}
    </Shell>
  );
}
