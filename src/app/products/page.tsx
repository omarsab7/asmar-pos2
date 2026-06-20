"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => Math.round(n || 0).toLocaleString("en-US") + " ل.ل";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [cat, setCat] = useState("الكل");
  const [edit, setEdit] = useState<any>(null);

  async function load() { const r = await fetch("/api/products"); const j = await r.json(); setProducts(j.products || []); }
  useEffect(() => { load(); }, []);

  const cats = ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];
  const shown = cat === "الكل" ? products : products.filter((p) => p.category === cat);

  async function saveEdit() {
    await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: edit.id, price: edit.price, nameAr: edit.nameAr, category: edit.category }) });
    setEdit(null); load();
  }

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold text-gold">المنتجات والأرباح</h1>
      <p className="mb-4 text-xs text-cream/50">اضغط «تعديل» لتغيير سعر أي منتج. التكلفة بتعدّلها من المخزون.</p>

      <div className="-mx-3 mb-4 flex gap-2 overflow-x-auto px-3">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${cat === c ? "bg-gradient-to-br from-caramel to-gold font-semibold text-[#1a1410]" : "border border-caramel/25 text-cream/70"}`}>{c}</button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => {
          const cogs = (p.recipe || []).reduce((s: number, r: any) => s + r.qty * (r.ingredient?.costPerUnit || 0), 0);
          const profit = p.price - cogs;
          const margin = p.price > 0 ? Math.round((profit / p.price) * 100) : 0;
          return (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-cream">{p.nameAr}</div>
                <div className="font-bold text-gold">{money(p.price)}</div>
              </div>
              <div className="mb-2 text-xs text-cream/50">{p.category}</div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-card p-2"><div className="text-cream/50">تكلفة</div><div className="mt-1 text-cream">{cogs ? money(cogs) : "—"}</div></div>
                <div className="rounded-lg bg-card p-2"><div className="text-cream/50">ربح</div><div className="mt-1 text-green-400">{cogs ? money(profit) : "—"}</div></div>
                <div className="rounded-lg bg-card p-2"><div className="text-cream/50">هامش</div><div className="mt-1 text-gold">{cogs ? margin + "%" : "—"}</div></div>
              </div>
              <button onClick={() => setEdit({ ...p })} className="mt-3 w-full rounded-lg border border-caramel/40 py-2 text-sm text-cream hover:bg-card">تعديل السعر</button>
            </div>
          );
        })}
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={() => setEdit(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-panel p-4 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div className="font-bold text-gold">تعديل: {edit.nameAr}</div><button onClick={() => setEdit(null)} className="text-cream/50">✕</button></div>
            <label className="mb-1 block text-sm text-cream/70">الاسم</label>
            <input className="input mb-3" value={edit.nameAr} onChange={(e) => setEdit({ ...edit, nameAr: e.target.value })} />
            <label className="mb-1 block text-sm text-cream/70">السعر (ل.ل)</label>
            <input className="input mb-3" type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} />
            <label className="mb-1 block text-sm text-cream/70">التصنيف</label>
            <input className="input mb-1" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} />
            <button className="btn btn-gold mt-4 w-full" onClick={saveEdit}>حفظ</button>
          </div>
        </div>
      )}
    </Shell>
  );
}
