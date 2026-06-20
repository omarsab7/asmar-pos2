"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@asmar.coffee");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true); setErr("");
    const r = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (r?.error) setErr("بيانات الدخول غير صحيحة");
    else router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-sm p-7">
        <div className="mb-1 text-center text-2xl font-bold text-gold">☕ Asmar Coffee</div>
        <div className="mb-6 text-center text-sm text-cream/60">نظام الإدارة الذكي — تسجيل الدخول</div>
        <label className="mb-1 block text-sm text-cream/70">الإيميل</label>
        <input className="input mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="mb-1 block text-sm text-cream/70">كلمة السر</label>
        <input className="input mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <div className="mb-3 text-sm text-red-400">{err}</div>}
        <button className="btn btn-gold w-full" onClick={submit} disabled={loading}>{loading ? "..." : "دخول"}</button>
        <div className="mt-4 text-center text-xs text-cream/40">admin@asmar.coffee / admin123<br/>cashier@asmar.coffee / cashier123</div>
      </div>
    </div>
  );
}
