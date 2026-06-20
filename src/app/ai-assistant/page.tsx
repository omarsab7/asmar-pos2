"use client";
import Shell from "@/components/Shell";
import AIAssistant from "@/components/AIAssistant";

export default function AIPage() {
  return (
    <Shell>
      <h1 className="mb-2 text-2xl font-bold text-gold">🤖 مساعد أسمر AI</h1>
      <p className="mb-5 text-sm text-cream/60">اكتب، احكي 🎤، أو ارفع صورة فاتورة/مخزون 📷 — والمساعد بينفّذ العملية مباشرة على النظام.</p>
      <div className="card mx-auto max-w-2xl p-4"><AIAssistant /></div>
    </Shell>
  );
}
