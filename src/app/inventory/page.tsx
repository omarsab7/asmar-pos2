"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => Math.round(n || 0).toLocaleString("en-US") + " ل.ل";

export default function Inventory() {
  const [ings, setIngs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", nameAr: "", unit: "حبة", stock: 0, minStock: 0, costPerUnit: 0 });
  const [edit, setEdit] = useState<any>(null);
  const [q, setQ] = useState("");
  const [restock, setRestock] = useState<any>(null);
  const [rQty, setRQty] = useState(0);
  const [rCost, setRCost] = useState(0);
  const [result, setResult] = useState<any>(null);

  async function load() {
    const r = await fetch("/api/inventory"); const j = await r.json(); setIngs(j.ingredients || []);
    const r2 = await fetch("/api/products"); const j2 = await r2.json(); setProducts(j2.products || []);
  }
  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("asmar:refresh", h);
    return () => window.removeEventListener("asmar:refresh", h);
  }, []);

  async function adjust(id: string, change: number) {
    await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, change }) });
    load();
  }
  async function addIngredient() {
    if (!form.nameAr) return;
    await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", nameAr: "", unit: "حبة", stock: 0, minStock: 0, costPerUnit: 0 });
    load();
  }
  async function saveEdit() {
    await fetch("/api/inventory", { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: edit.id, nameAr: edit.nameAr, unit: edit.unit, costPerUnit: edit.costPerUnit, minStock: edit.minStock, stock: edit.stock }) });
    setEdit(null); load();
  }

  function openRestock(i: any) { setRestock(i); setRQty(0); setRCost(i.costPerUnit || 0); setResult(null); }

  async function doRestock() {
    if (rQty <= 0) return;
    // 1) زيادة الكمية
    await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: restock.id, change: rQty, reason: "توريد" }) });
    // 2) تحديث التكلفة إذا تغيّرت
    if (Number(rCost) !== Number(restock.costPerUnit)) {
      await fetch("/api/inventory", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: restock.id, costPerUnit: rCost }) });
    }
    // 3) تحليل: المنتج المرتبط، ربح الحبة، الربح المتوقع من الكمية، حالة النقص
    const linked = products.find((p) => (p.recipe || []).some((r: any) => r.ingredient?.id === restock.id));
    let analysis: any = { stockAfter: restock.stock + rQty, low: (restock.stock + rQty) <= restock.minStock };
    if (linked) {
      const recQty = (linked.recipe.find((r: any) => r.ingredient?.id === restock.id)?.qty) || 1;
      const cogs = linked.recipe.reduce((s: number, r: any) => s + r.qty * (r.ingredient?.id === restock.id ? Number(rCost) : (r.ingredient?.costPerUnit || 0)), 0);
      const profitPer = linked.price - cogs;
      const units = Math.floor(rQty / recQty);
      analysis = { ...analysis, product: linked.nameAr, profitPer, units, totalProfit: profitPer * units, price: linked.price };
    }
    setResult(analysis);
    load();
  }

  async function resetAccount() {
    const r = await fetch("/api/reset", { method: "POST" });
    if (r.ok) { alert("تم تصفير المبيعات والفواتير ✅ — المنيو والمخزون بمكانهم."); }
    else { const j = await r.json().catch(() => ({})); alert("ما نجح التصفير: " + (j.error || "")); }
  }

  const shown = ings.filter((i) => !q.trim() || i.nameAr.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold text-gold">المخزون</h1>
      <p className="mb-4 text-xs text-cream/50">«توريد» لإضافة كمية جديدة وتحليل ربحها. «تعديل» لتغيير التفاصيل.</p>

      <div className="card mb-5 p-4">
        <div className="mb-3 font-semibold text-cream">➕ إضافة مادة جديدة</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <input className="input" placeholder="بالعربي" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <input className="input" placeholder="English (مميّز)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="وحدة" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input className="input" type="number" placeholder="كمية" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          <input className="input" type="number" placeholder="حد التنبيه" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
          <input className="input" type="number" placeholder="تكلفة/وحدة (ل.ل)" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })} />
        </div>
        <button className="btn btn-gold mt-3" onClick={addIngredient}>إضافة</button>
      </div>

      <input className="input mb-3" placeholder="🔍 دوّر عن مادة..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-2">
        {shown.map((i) => {
          const low = i.stock <= i.minStock;
          return (
            <div key={i.id} className="card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-cream">{i.nameAr} {low && <span className="text-xs text-red-400">⚠️ نقص</span>}</div>
                  <div className="text-xs text-cream/50">باقي {i.stock}{i.unit} · حد {i.minStock}{i.unit} · تكلفة {i.costPerUnit ? money(i.costPerUnit) : "—"}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openRestock(i)} className="rounded-lg bg-gradient-to-br from-caramel to-gold px-3 py-1.5 text-sm font-semibold text-[#1a1410]">توريد</button>
                  <button onClick={() => setEdit({ ...i })} className="rounded-lg border border-caramel/40 px-3 py-1.5 text-sm text-cream">تعديل</button>
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                <button onClick={() => adjust(i.id, 1)} className="rounded bg-card px-3 py-1 text-sm">+1</button>
                <button onClick={() => adjust(i.id, -1)} className="rounded bg-card px-3 py-1 text-sm">−1</button>
                <button onClick={() => adjust(i.id, -10)} className="rounded bg-card px-3 py-1 text-sm">−10</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* تصفير الحساب */}
      <div className="card mt-6 border-r-4 border-red-500 p-4">
        <div className="mb-1 font-semibold text-cream">🔄 تصفير الحساب</div>
        <p className="mb-3 text-xs text-cream/50">بيمسح كل المبيعات والفواتير ليبلّش حساب جديد. المنيو والمخزون والزباين ما بينمسحوا.</p>
        <button onClick={() => { if (confirm("متأكد؟ رح تنمسح كل المبيعات والفواتير. ما في رجعة.")) { if (confirm("تأكيد أخير: تصفير الحساب؟")) resetAccount(); } }}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">تصفير المبيعات والفواتير</button>
      </div>

      {/* مودال التعديل */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={() => setEdit(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-panel p-4 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div className="font-bold text-gold">تعديل: {edit.nameAr}</div><button onClick={() => setEdit(null)} className="text-cream/50">✕</button></div>
            <label className="mb-1 block text-sm text-cream/70">الاسم</label>
            <input className="input mb-3" value={edit.nameAr} onChange={(e) => setEdit({ ...edit, nameAr: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="mb-1 block text-sm text-cream/70">الكمية الحالية</label><input className="input" type="number" value={edit.stock} onChange={(e) => setEdit({ ...edit, stock: Number(e.target.value) })} /></div>
              <div><label className="mb-1 block text-sm text-cream/70">حد التنبيه</label><input className="input" type="number" value={edit.minStock} onChange={(e) => setEdit({ ...edit, minStock: Number(e.target.value) })} /></div>
              <div><label className="mb-1 block text-sm text-cream/70">التكلفة (ل.ل)</label><input className="input" type="number" value={edit.costPerUnit} onChange={(e) => setEdit({ ...edit, costPerUnit: Number(e.target.value) })} /></div>
              <div><label className="mb-1 block text-sm text-cream/70">الوحدة</label><input className="input" value={edit.unit} onChange={(e) => setEdit({ ...edit, unit: e.target.value })} /></div>
            </div>
            <button className="btn btn-gold mt-4 w-full" onClick={saveEdit}>حفظ</button>
          </div>
        </div>
      )}

      {/* مودال التوريد + التحليل */}
      {restock && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={() => { setRestock(null); setResult(null); }}>
          <div className="w-full max-w-md rounded-t-3xl bg-panel p-4 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div className="font-bold text-gold">توريد: {restock.nameAr}</div><button onClick={() => { setRestock(null); setResult(null); }} className="text-cream/50">✕</button></div>

            {!result ? (
              <>
                <label className="mb-1 block text-sm text-cream/70">كم {restock.unit} جبت؟</label>
                <input className="input mb-3" type="number" value={rQty || ""} onChange={(e) => setRQty(Number(e.target.value))} placeholder="مثلاً 10" />
                <label className="mb-1 block text-sm text-cream/70">تكلفة الوحدة الواحدة (ل.ل)</label>
                <input className="input mb-1" type="number" value={rCost || ""} onChange={(e) => setRCost(Number(e.target.value))} placeholder={String(restock.costPerUnit || 0)} />
                <p className="mb-3 text-xs text-cream/40">خلّيها متل ما هي إذا التكلفة ما تغيّرت.</p>
                <button className="btn btn-gold w-full" onClick={doRestock}>أضف وحلّل</button>
              </>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="rounded-xl bg-card p-3">
                  <div className="text-cream">✅ أضفت {rQty}{restock.unit} — صار باقي <b className="text-gold">{result.stockAfter}{restock.unit}</b></div>
                  <div className={result.low ? "mt-1 text-red-400" : "mt-1 text-green-400"}>{result.low ? "⚠️ لسا تحت حد التنبيه — لازم تطلب كمان" : "👍 المخزون منيح فوق حد التنبيه"}</div>
                </div>
                {result.product ? (
                  <div className="rounded-xl bg-card p-3">
                    <div className="mb-1 font-semibold text-gold">💹 تحليل الربح</div>
                    <div className="text-cream/80">المنتج: {result.product} (بيع {money(result.price)})</div>
                    <div className="text-cream/80">ربح الوحدة: <b className="text-green-400">{money(result.profitPer)}</b></div>
                    <div className="text-cream/80">من الكمية يلي جبتها (~{result.units} وحدة):</div>
                    <div className="mt-1 text-lg font-bold text-gold">ربح متوقع ≈ {money(result.totalProfit)}</div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-card p-3 text-cream/60">ما في منتج مربوط بهالمادة بعد — اربطها بمنتج من صفحة المنتجات ليصير التحليل.</div>
                )}
                <button className="btn btn-gold w-full" onClick={() => { setRestock(null); setResult(null); }}>تمام</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
