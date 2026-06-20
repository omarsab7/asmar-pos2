"use client";
import { useEffect, useState } from "react";

export default function PWA() {
  const [deferred, setDeferred] = useState<any>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // standalone check
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (standalone) return;

    const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); setHidden(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari has no beforeinstallprompt → show manual hint
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) { setShowIOS(true); setHidden(false); }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null); setHidden(true);
  }

  if (hidden) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-caramel/40 bg-panel p-3 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="text-2xl">📲</div>
        <div className="flex-1 text-sm">
          {showIOS ? (
            <span>لتثبيت التطبيق: اضغط <b>مشاركة</b> ⬆️ ثم <b>«أضِف إلى الشاشة الرئيسية»</b>.</span>
          ) : (
            <span>ثبّت <b className="text-gold">Asmar POS</b> على شاشتك واستعملو متل تطبيق.</span>
          )}
        </div>
        {!showIOS && <button onClick={install} className="btn btn-gold !py-1.5 !px-3 text-sm">تثبيت</button>}
        <button onClick={() => setHidden(true)} className="text-cream/50">✕</button>
      </div>
    </div>
  );
}
