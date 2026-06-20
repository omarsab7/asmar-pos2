"use client";
import { useEffect, useRef, useState } from "react";
import Shell from "@/components/Shell";

const money = (n: number) => Math.round(n || 0).toLocaleString("en-US") + " ل.ل";
type Cart = Record<string, { name: string; price: number; qty: number }>;

export default function POS() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [cat, setCat] = useState<string>("الكل");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState("");
  const [listening, setListening] = useState(false);
  const [payMode, setPayMode] = useState<"paid" | "unpaid" | "partial">("paid");
  const [paidAmount, setPaidAmount] = useState(0);
  const [voiceRes, setVoiceRes] = useState<any>(null);
  const recRef = useRef<any>(null);

  async function load() { const r = await fetch("/api/products"); const j = await r.json(); setProducts(j.products || []); }
  async function loadCustomers() { const r = await fetch("/api/customers"); const j = await r.json(); setCustomers(j.customers || []); }
  useEffect(() => { load(); loadCustomers(); }, []);

  const cats = ["الكل", ...Array.from(new Set(products.map((p) => p.category)))];
  let shown = cat === "الكل" ? products : products.filter((p) => p.category === cat);
  if (q.trim()) shown = products.filter((p) => (p.nameAr + " " + p.name).toLowerCase().includes(q.trim().toLowerCase()));

  const add = (p: any) => { setCart((c) => ({ ...c, [p.id]: { name: p.nameAr, price: p.price, qty: (c[p.id]?.qty || 0) + 1 } })); buzz(); };
  const dec = (id: string) => setCart((c) => { const x = (c[id]?.qty || 0) - 1; const n = { ...c }; if (x <= 0) delete n[id]; else n[id] = { ...n[id], qty: x }; return n; });
  const count = Object.values(cart).reduce((s, x) => s + x.qty, 0);
  const total = Object.values(cart).reduce((s, x) => s + x.price * x.qty, 0);
  const buzz = () => { try { (navigator as any).vibrate?.(15); } catch {} };
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  async function checkout() {
    const items = Object.entries(cart).map(([productId, v]) => ({ productId, qty: v.qty }));
    if (!items.length) return;
    const paid = payMode === "paid" ? total : payMode === "unpaid" ? 0 : Math.min(paidAmount, total);
    const r = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, customerId: customerId || undefined, paid }) });
    const j = await r.json();
    if (j.sale) {
      const remain = total - paid;
      flash(`✅ تمّ البيع ${money(total)}` + (remain > 0 ? ` · باقي دين ${money(remain)}` : ""));
      setCart({}); setSheet(false); setCustomerId(""); setPayMode("paid"); setPaidAmount(0);
      window.dispatchEvent(new CustomEvent("asmar:refresh"));
    } else flash("صار خطأ بالبيع.");
  }

  const norm = (s: string) => (s || "").toString().toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[إأآا]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/[^\u0621-\u064Aa-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

  // يفهم من الجملة: المنتجات + الزبون
  function parseVoice(t: string) {
    const nt = norm(t);
    const matched: { id: string; name: string; qty: number }[] = [];
    for (const p of products) {
      const np = norm(p.nameAr);
      if (!np) continue;
      const toks = np.split(" ");
      const hit = nt.includes(np) || (toks.length > 1 && toks.every((w) => w.length > 1 && nt.includes(w))) || (toks.length === 1 && np.length > 2 && nt.includes(np));
      if (hit) matched.push({ id: p.id, name: p.nameAr, qty: 1 });
    }
    let cust: any = null;
    for (const c of customers) { if (norm(c.name) && nt.includes(norm(c.name))) { cust = c; break; } }
    return { transcript: t, items: matched, customer: cust };
  }

  function voiceSell() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { flash("المتصفح ما بيدعم الصوت — جرّب Chrome."); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR(); rec.lang = "ar-SA"; rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      const parsed = parseVoice(t);
      if (!parsed.items.length) { flash(`سمعت: "${t}" — ما عرفت المنتج. جرّب كمان.`); return; }
      buzz(); setVoiceRes(parsed);
    };
    rec.onend = () => setListening(false); rec.onerror = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  }

  function confirmVoice() {
    if (!voiceRes) return;
    setCart((c) => {
      const n = { ...c };
      for (const it of voiceRes.items) {
        const p = products.find((x) => x.id === it.id);
        if (p) n[p.id] = { name: p.nameAr, price: p.price, qty: (n[p.id]?.qty || 0) + it.qty };
      }
      return n;
    });
    if (voiceRes.customer) setCustomerId(voiceRes.customer.id);
    flash("✅ تضافوا للسلة");
    setVoiceRes(null);
  }

  return (
    <Shell>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gold">الكاشير</h1>
        <button onClick={voiceSell} className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${listening ? "animate-pulse bg-red-500 text-white" : "bg-mocha text-cream"}`}>🎤 بيع بالصوت</button>
      </div>

      <input className="input mb-3" placeholder="🔍 دوّر عن منتج..." value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="mb-3">
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input !py-2 text-sm">
          <option value="">👤 بدون زبون</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
        </select>
      </div>

      {!q && (
        <div className="-mx-3 mb-3 flex gap-2 overflow-x-auto px-3 pb-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm ${cat === c ? "bg-gradient-to-br from-caramel to-gold font-semibold text-[#1a1410]" : "border border-caramel/25 text-cream/70"}`}>{c}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((p) => {
          const x = cart[p.id]?.qty || 0;
          return (
            <button key={p.id} onClick={() => add(p)}
              className="relative flex min-h-[96px] flex-col justify-between rounded-2xl border border-caramel/20 bg-card p-3 text-right active:scale-95 active:border-caramel">
              {x > 0 && <span className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-bold text-[#1a1410]">{x}</span>}
              <div className="text-base font-semibold leading-tight text-cream">{p.nameAr}</div>
              <div className="mt-1 text-lg font-bold text-gold">{money(p.price)}</div>
            </button>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-caramel/25 bg-panel/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center gap-2 p-3">
          <button onClick={() => setSheet(true)} className="flex flex-1 items-center justify-between rounded-xl bg-card px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-cream/80">🛒 <b className="text-cream">{count}</b> صنف</span>
            <span className="text-lg font-bold text-gold">{money(total)}</span>
          </button>
          <button onClick={() => (count ? setSheet(true) : null)} disabled={!count}
            className="rounded-xl bg-gradient-to-br from-caramel to-gold px-6 py-3 text-base font-bold text-[#1a1410] active:scale-95 disabled:opacity-40">بيع 💳</button>
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setSheet(false)}>
          <div className="max-h-[85svh] w-full overflow-y-auto rounded-t-3xl bg-panel p-4" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-cream/20" />
            <div className="mb-2 flex items-center justify-between"><div className="font-bold text-gold">🛒 السلة</div><button onClick={() => setCart({})} className="text-sm text-cream/50">تفريغ</button></div>
            {Object.keys(cart).length === 0 && <div className="py-6 text-center text-sm text-cream/50">فاضية.</div>}
            {Object.entries(cart).map(([id, v]) => (
              <div key={id} className="flex items-center justify-between border-b border-caramel/10 py-3">
                <span className="text-sm">{v.name}</span>
                <span className="flex items-center gap-3">
                  <button onClick={() => dec(id)} className="h-9 w-9 rounded-lg bg-card text-lg">−</button>
                  <span className="w-5 text-center">{v.qty}</span>
                  <button onClick={() => add({ id, nameAr: v.name, price: v.price })} className="h-9 w-9 rounded-lg bg-card text-lg">+</button>
                  <span className="w-20 text-left text-gold">{money(v.price * v.qty)}</span>
                </span>
              </div>
            ))}

            <div className="mt-3 flex items-center justify-between text-lg font-bold"><span>المجموع</span><span className="text-gold">{money(total)}</span></div>

            {/* حالة الدفع */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <button onClick={() => setPayMode("paid")} className={`rounded-xl py-2 ${payMode === "paid" ? "bg-green-600 text-white" : "border border-caramel/30 text-cream/70"}`}>مدفوع</button>
              <button onClick={() => setPayMode("partial")} className={`rounded-xl py-2 ${payMode === "partial" ? "bg-caramel text-[#1a1410]" : "border border-caramel/30 text-cream/70"}`}>دفع جزئي</button>
              <button onClick={() => setPayMode("unpaid")} className={`rounded-xl py-2 ${payMode === "unpaid" ? "bg-red-600 text-white" : "border border-caramel/30 text-cream/70"}`}>دين</button>
            </div>
            {payMode === "partial" && (
              <div className="mt-2">
                <label className="mb-1 block text-sm text-cream/70">كم دفع؟ (الباقي بيصير دين)</label>
                <input className="input" type="number" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} placeholder="مثلاً 50000" />
                {paidAmount > 0 && paidAmount < total && <div className="mt-1 text-xs text-red-400">باقي دين: {money(total - paidAmount)}</div>}
              </div>
            )}
            {payMode === "unpaid" && <div className="mt-2 text-xs text-red-400">⚠️ كل المبلغ ({money(total)}) رح يتسجّل دين على الزبون.</div>}

            <button onClick={checkout} disabled={!count} className="btn btn-gold mt-4 w-full !py-3.5 text-lg disabled:opacity-40">تسجيل البيع 💳</button>
          </div>
        </div>
      )}

      {voiceRes && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 md:items-center" onClick={() => setVoiceRes(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-panel p-4 md:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 font-bold text-gold">🎤 شو فهمت</div>
            <div className="mb-3 text-xs text-cream/40">سمعت: "{voiceRes.transcript}"</div>
            <div className="mb-2 space-y-1">
              {voiceRes.items.map((it: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-card px-3 py-2 text-sm">
                  <span className="text-cream">{it.name}</span>
                  <span className="flex items-center gap-2">
                    <button onClick={() => setVoiceRes({ ...voiceRes, items: voiceRes.items.map((x: any, j: number) => j === i ? { ...x, qty: Math.max(1, x.qty - 1) } : x) })} className="h-7 w-7 rounded-full bg-mocha text-cream">−</button>
                    <b className="text-gold">{it.qty}</b>
                    <button onClick={() => setVoiceRes({ ...voiceRes, items: voiceRes.items.map((x: any, j: number) => j === i ? { ...x, qty: x.qty + 1 } : x) })} className="h-7 w-7 rounded-full bg-mocha text-cream">+</button>
                    <button onClick={() => setVoiceRes({ ...voiceRes, items: voiceRes.items.filter((_: any, j: number) => j !== i) })} className="mr-1 text-red-400">✕</button>
                  </span>
                </div>
              ))}
            </div>
            <div className="mb-3 rounded-xl bg-card px-3 py-2 text-sm">
              <span className="text-cream/60">الزبون: </span>
              <span className="text-cream">{voiceRes.customer ? voiceRes.customer.name : "بدون زبون"}</span>
            </div>
            {!voiceRes.items.length && <div className="mb-2 text-sm text-red-400">ما ضل منتج — سكّر وجرّب كمان.</div>}
            <div className="flex gap-2">
              <button className="btn btn-gold flex-1" disabled={!voiceRes.items.length} onClick={confirmVoice}>✅ أكّد وأضف للسلة</button>
              <button className="flex-1 rounded-xl border border-caramel/30 py-2 text-cream/70" onClick={() => { setVoiceRes(null); voiceSell(); }}>🎤 جرّب كمان</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-mocha px-5 py-2.5 text-sm text-cream shadow-lg">{toast}</div>}
      <div className="h-16" />
    </Shell>
  );
}
