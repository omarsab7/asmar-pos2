"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => Math.round(n || 0).toLocaleString("en-US") + " ل.ل";

export default function Inventory() {
  const [ings, setIngs] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", nameAr: "", unit: "حبة", stock: 0, minStock: 0, costPerUnit: 0 });
  const [edit, setEdit] = useState<any>(null);
  const [q, setQ] = useState("");

  async function load() { const r = await fetch("/api/inventory"); const j = await r.json(); setIngs(j.ingredients || []); }
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

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold text-gold">المخزون</h1>
      <p className="mb-4 text-xs text-cream/50">عدّل الكمية والتكلفة وحد التنبيه لكل مادة. كل بيع بيخصم تلقائياً.</p>

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
        {ings.filter((i) => !q.trim() || i.nameAr.toLowerCase().includes(q.trim().toLowerCase())).map((i) => {
          const low = i.stock <= i.minStock;
          return (
            <div key={i.id} className="card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-cream">{i.nameAr} {low && <span className="text-xs text-red-400">⚠️ نقص</span>}</div>
                  <div className="text-xs text-cream/50">باقي {i.stock}{i.unit} · حد {i.minStock}{i.unit} · تكلفة {i.costPerUnit ? money(i.costPerUnit) : "—"}</div>
                </div>
                <button onClick={() => setEdit({ ...i })} className="rounded-lg border border-caramel/40 px-3 py-1.5 text-sm text-cream">تعديل</button>
              </div>
              <div className="mt-2 flex gap-1">
                <button onClick={() => adjust(i.id, 1)} className="rounded bg-card px-3 py-1 text-sm">+1</button>
                <button onClick={() => adjust(i.id, 10)} className="rounded bg-card px-3 py-1 text-sm">+10</button>
                <button onClick={() => adjust(i.id, -1)} className="rounded bg-card px-3 py-1 text-sm">−1</button>
                <button onClick={() => adjust(i.id, -10)} className="rounded bg-card px-3 py-1 text-sm">−10</button>
              </div>
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
    </Shell>
  );
}
