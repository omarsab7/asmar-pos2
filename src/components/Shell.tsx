"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import AIAssistant from "./AIAssistant";

const NAV = [
  { href: "/dashboard", label: "الرئيسية", icon: "📊" },
  { href: "/reports", label: "التقارير", icon: "📈" },
  { href: "/pos", label: "كاشير", icon: "🧾" },
  { href: "/inventory", label: "المخزون", icon: "📦" },
  { href: "/products", label: "المنتجات", icon: "☕" },
  { href: "/customers", label: "الزباين", icon: "👥" },
  { href: "/ai-assistant", label: "المساعد", icon: "🤖" },
];
const MOBILE_NAV = ["/dashboard", "/pos", "/customers", "/reports", "/ai-assistant"];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { data: session } = useSession();
  const [aiOpen, setAiOpen] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-[100svh] md:flex">
      {/* desktop sidebar / mobile drawer */}
      <aside className={`fixed inset-y-0 right-0 z-40 w-64 transform border-l border-caramel/15 bg-panel p-4 transition md:static md:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="mb-6 flex items-center gap-2 px-2 text-xl font-bold text-gold">☕ Asmar</div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${path === n.href ? "bg-gradient-to-br from-caramel to-gold font-semibold text-[#1a1410]" : "text-cream/80 hover:bg-card"}`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="mt-6 w-full rounded-xl border border-caramel/30 px-3 py-2 text-sm text-cream/70 hover:bg-card">تسجيل الخروج</button>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1">
        {/* topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-caramel/15 bg-espresso/90 px-3 py-2.5 backdrop-blur" style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}>
          <button className="rounded-lg border border-caramel/30 px-3 py-2 text-base md:hidden" onClick={() => setOpen(true)} aria-label="القائمة">☰</button>
          <div className="truncate text-xs text-cream/60">{session?.user?.name} · {(session?.user as any)?.role}</div>
          <button className="btn btn-out !px-3 !py-1.5 text-sm" onClick={() => setAiOpen(true)}>🤖</button>
        </header>

        <main className="p-3 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>

      {/* mobile bottom nav (thumb-friendly) — hidden on POS to free the bottom for the cart bar */}
      {path !== "/pos" && (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-caramel/20 bg-panel/95 backdrop-blur md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {NAV.filter((n) => MOBILE_NAV.includes(n.href)).map((n) => (
            <Link key={n.href} href={n.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${path === n.href ? "text-gold" : "text-cream/60"}`}>
              <span className="text-xl">{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
      )}

      {/* desktop floating AI */}
      <button onClick={() => setAiOpen(true)}
        className="fixed bottom-5 left-5 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-caramel to-gold text-2xl text-[#1a1410] shadow-lg md:flex">🤖</button>

      {/* AI overlay — full screen on mobile */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 md:justify-start" onClick={() => setAiOpen(false)}>
          <div className="flex h-[100svh] w-full flex-col bg-panel p-3 md:max-w-md md:p-4" onClick={(e) => e.stopPropagation()}
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-bold text-gold">🤖 مساعد أسمر AI</div>
              <button onClick={() => setAiOpen(false)} className="rounded-lg bg-card px-3 py-1.5 text-cream/70">✕ إغلاق</button>
            </div>
            <div className="flex-1 overflow-hidden"><AIAssistant /></div>
          </div>
        </div>
      )}
    </div>
  );
}
