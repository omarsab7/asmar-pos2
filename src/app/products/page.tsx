"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => Math.round(n || 0).toLocaleString("en-US") + " ل.ل";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [ings, setIngs] = useState<any[]>([]);
  const [cat, setCat] = useState("الكل");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [nw, setNw] = useState<any>({ nameAr: "", price: 0, category: "", recipe: [{ ingredientId: "", qty: 1 }] });

  async function load() {
    const r = await fetch("/api/products"); const j = await r.json(); setProducts(j.products || []);
    const r2 = await fetch("/api/inventory"); const j2 = await r2.json(); setIngs(j2.ingredients || []);
  }
  useEffect(() => { load(); }, []);

  const cats = ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];
  let shown = cat === "الكل" ? products : products.filter((p) => p.category === cat);
  if (q.trim()) { const t = q.trim().toLowerCase(); shown = shown.filter((p) => p.nameAr.toLowerCase().includes(t)); }

  async function saveEdit() {
    await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: edit.id, price: edit.price, nameAr: edit.nameAr, category: edit.category }) });
    setEdit(null); load();
  }

  async function saveNew() {
    if (!nw.nameAr || !nw.price) return;
    const recipe = nw.recipe.filter((r: any) => r.ingredientId).map((r: any) => ({ ingredientId: r.ingredientId, qty: Number(r.qty) || 1 }));
    await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "item-" + Date.now(), nameAr: nw.nameAr, price: Number(nw.price), category: nw.category || "عام", recipe }) });
    setAdding(false); setNw({ nameAr: "", price: 0, category: "", recipe: [{ ingredientId: "", qty: 1 }] }); load();
  }

  return (
    <Shell>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold">المنتجات والأرباح</h1>
        <button onClick={() => setAdding(true)} className="btn btn-gold text-sm">➕ منتج جديد</button>
      </div>
      <p className="mb-3 text-xs text-cream/50">«تعديل السعر» لأي منتج. التكلفة بتعدّلها من المخزون.</p>

      <input className="input mb-3" placeholder="🔍 دوّر عن منتج..." value={q} onChange={(e) => setQ(e.target.value)} />
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

      {/* تعديل منتج */}
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

      {/* إضافة منتج جديد */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={() => setAdding(false)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-panel p-4 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div className="font-bold text-gold">➕ منتج جديد للبيع</div><button onClick={() => setAdding(false)} className="text-cream/50">✕</button></div>

            <label className="mb-1 block text-sm text-cream/70">اسم المنتج (بالعربي)</label>
            <input className="input mb-3" placeholder="مثلاً: شاي" value={nw.nameAr} onChange={(e) => setNw({ ...nw, nameAr: e.target.value })} />

            <div className="grid grid-cols-2 gap-2">
              <div><label className="mb-1 block text-sm text-cream/70">سعر البيع (ل.ل)</label><input className="input" type="number" placeholder="40000" value={nw.price || ""} onChange={(e) => setNw({ ...nw, price: Number(e.target.value) })} /></div>
              <div><label className="mb-1 block text-sm text-cream/70">التصنيف</label>
                <input className="input" list="cats" placeholder="مثلاً: مشروب ساخن" value={nw.category} onChange={(e) => setNw({ ...nw, category: e.target.value })} />
                <datalist id="cats">{cats.filter((c) => c !== "الكل").map((c) => <option key={c} value={c} />)}</datalist>
              </div>
            </div>

            <div className="mt-4 mb-1 text-sm font-semibold text-cream">شو بياخد من المخزون؟ <span className="text-xs font-normal text-cream/50">(اختياري — لخصم المواد)</span></div>
            {nw.recipe.map((r: any, idx: number) => (
              <div key={idx} className="mb-2 flex gap-2">
                <select className="input flex-1" value={r.ingredientId} onChange={(e) => { const rec = [...nw.recipe]; rec[idx].ingredientId = e.target.value; setNw({ ...nw, recipe: rec }); }}>
                  <option value="">— اختر مادة —</option>
                  {ings.map((i) => <option key={i.id} value={i.id}>{i.nameAr}</option>)}
                </select>
                <input className="input w-20" type="number" min={1} value={r.qty} onChange={(e) => { const rec = [...nw.recipe]; rec[idx].qty = Number(e.target.value); setNw({ ...nw, recipe: rec }); }} />
                {nw.recipe.length > 1 && <button onClick={() => setNw({ ...nw, recipe: nw.recipe.filter((_: any, i: number) => i !== idx) })} className="rounded-lg border border-red-500/40 px-3 text-red-400">✕</button>}
              </div>
            ))}
            <button onClick={() => setNw({ ...nw, recipe: [...nw.recipe, { ingredientId: "", qty: 1 }] })} className="text-sm text-gold">+ مادة أخرى</button>

            <button className="btn btn-gold mt-5 w-full" onClick={saveNew}>إضافة المنتج</button>
            <p className="mt-2 text-center text-xs text-cream/40">رح يظهر فوراً بالكاشير والمنتجات.</p>
          </div>
        </div>
      )}
    </Shell>
  );
}
