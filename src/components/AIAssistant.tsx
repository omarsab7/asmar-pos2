"use client";
import { useRef, useState } from "react";

type Msg = { role: "user" | "ai"; text: string };

export default function AIAssistant() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "أهلين! اسألني: «كم الربح اليوم؟»، «شو أكثر منتج مبيعاً؟»، «اعمل بيع كابتشينو واحد»، «ورجيني مخزون الحليب». أو احكيني 🎤 أو صوّرلي فاتورة 📷." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [imgMode, setImgMode] = useState<"invoice" | "shelf">("invoice");
  const recRef = useRef<any>(null);

  const push = (m: Msg) => setMsgs((x) => [...x, m]);

  async function send(text: string, type: "text" | "voice" | "image" = "text", mode?: string) {
    if (!text.trim()) return;
    push({ role: "user", text: type === "image" ? `📷 صورة (${mode === "shelf" ? "مخزون" : "فاتورة"})` : text });
    setBusy(true);
    try {
      const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: text, type, mode }) });
      const data = await r.json();
      push({ role: "ai", text: data.message || "صار خطأ." });
      if (data.action) window.dispatchEvent(new CustomEvent("asmar:refresh"));
    } catch { push({ role: "ai", text: "تعذّر الاتصال بالخادم." }); }
    finally { setBusy(false); }
  }

  function onSendText() { const t = input; setInput(""); send(t, "text"); }

  function toggleVoice() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { push({ role: "ai", text: "المتصفح ما بيدعم الصوت. جرّب Chrome." }); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "ar-SA"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput(t); send(t, "voice"); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  }

  async function onImage(file: File) {
    setBusy(true);
    push({ role: "ai", text: "📷 عم اقرأ الصورة..." });
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "eng+ara");
      await send((data.text || "").trim() || "(صورة بدون نص واضح)", "image", imgMode);
    } catch { push({ role: "ai", text: "تعذّرت قراءة الصورة." }); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex-1 space-y-2 overflow-y-auto rounded-xl border border-caramel/15 bg-espresso p-3">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-mocha text-cream" : "bg-card text-cream/90"}`}>{m.text}</div>
        ))}
        {busy && <div className="text-xs text-cream/40">... عم فكّر</div>}
      </div>

      {/* camera / gallery */}
      <div className="mb-2 grid grid-cols-2 gap-2">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-caramel/40 py-2.5 text-sm text-cream/70">
          📷 كاميرا
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])} />
        </label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-caramel/40 py-2.5 text-sm text-cream/70"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onImage(f); }}>
          🖼️ من الصور
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])} />
        </label>
      </div>
      <div className="mb-2 flex gap-2 text-xs">
        <button onClick={() => setImgMode("invoice")} className={`rounded-full px-3 py-1 ${imgMode === "invoice" ? "bg-caramel text-[#1a1410]" : "border border-caramel/30 text-cream/70"}`}>🧾 فاتورة</button>
        <button onClick={() => setImgMode("shelf")} className={`rounded-full px-3 py-1 ${imgMode === "shelf" ? "bg-caramel text-[#1a1410]" : "border border-caramel/30 text-cream/70"}`}>📦 رفوف مخزون</button>
      </div>

      <div className="flex gap-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <button onClick={toggleVoice} aria-label="صوت"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${listening ? "animate-pulse bg-red-500 text-white" : "bg-mocha text-cream"}`}>🎤</button>
        <input className="input" placeholder="اكتب سؤالك..." value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSendText()} />
        <button className="btn btn-gold shrink-0" onClick={onSendText} disabled={busy}>إرسال</button>
      </div>
    </div>
  );
}
