"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => "$" + (Math.round((n || 0) * 100) / 100).toFixed(2);

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  async function load() { const r = await fetch("/api/products"); const j = await r.json(); setProducts(j.products || []); }
  useEffect(() => { load(); }, []);

  return (
    <Shell>
      <h1 className="mb-5 text-2xl font-bold text-gold">المنتجات والوصفات</h1>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-cream">{p.nameAr}</div>
              <div className="font-bold text-gold">{money(p.price)}</div>
            </div>
            <div className="mb-2 text-xs text-cream/50">{p.category} · {p.name}</div>
            <div className="text-xs text-cream/70">
              <div className="mb-1 text-cream/50">الوصفة (لكل وحدة):</div>
              {p.recipe?.length ? p.recipe.map((r: any) => (
                <span key={r.id} className="mb-1 mr-1 inline-block rounded-full bg-card px-2 py-0.5">{r.ingredient.nameAr} {r.qty}{r.ingredient.unit}</span>
              )) : <span className="text-cream/40">بدون وصفة</span>}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
