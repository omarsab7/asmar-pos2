"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

export default function Inventory() {
  const [ings, setIngs] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", nameAr: "", unit: "g", stock: 0, minStock: 0, costPerUnit: 0 });

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
    setForm({ name: "", nameAr: "", unit: "g", stock: 0, minStock: 0, costPerUnit: 0 });
    load();
  }

  return (
    <Shell>
      <h1 className="mb-5 text-2xl font-bold text-gold">المخزون</h1>

      <div className="card mb-5 p-4">
        <div className="mb-3 font-semibold text-cream">➕ إضافة مادة خام</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <input className="input" placeholder="بالعربي" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <input className="input" placeholder="English" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="وحدة" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input className="input" type="number" placeholder="كمية" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          <input className="input" type="number" placeholder="حد النقص" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
          <input className="input" type="number" placeholder="كلفة/وحدة" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })} />
        </div>
        <button className="btn btn-gold mt-3" onClick={addIngredient}>إضافة</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-panel text-cream/60">
            <tr><th className="p-3">المادة</th><th className="p-3">المخزون</th><th className="p-3">حد النقص</th><th className="p-3">الحالة</th><th className="p-3">تعديل</th></tr>
          </thead>
          <tbody>
            {ings.map((i) => {
              const low = i.stock <= i.minStock;
              return (
                <tr key={i.id} className="border-t border-caramel/10">
                  <td className="p-3 font-medium">{i.nameAr}</td>
                  <td className="p-3">{i.stock}{i.unit}</td>
                  <td className="p-3 text-cream/60">{i.minStock}{i.unit}</td>
                  <td className="p-3">{low ? <span className="text-red-400">⚠️ نقص</span> : <span className="text-green-400">✅ تمام</span>}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => adjust(i.id, 100)} className="rounded bg-card px-2 py-1">+100</button>
                      <button onClick={() => adjust(i.id, 1000)} className="rounded bg-card px-2 py-1">+1000</button>
                      <button onClick={() => adjust(i.id, -100)} className="rounded bg-card px-2 py-1">−100</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
