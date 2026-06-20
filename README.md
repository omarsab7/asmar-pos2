# ☕ Asmar Coffee — Mobile POS (PWA)

نظام إدارة مقهى أسمر كـ **Progressive Web App** موبايل-أول: **POS سريع + Inventory + Dashboard + Asmar AI Assistant** (نص + صوت 🎤 + كاميرا 📷). يتثبّت على الهاتف من المتصفح ويشتغل متل تطبيق — بدون APK / React Native / Flutter.

## التشغيل محلياً
يحتاج قاعدة **PostgreSQL** (مجاناً من Neon.tech). حط رابطها بـ `.env` كـ `DATABASE_URL` ثم:
```bash
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev            # http://localhost:3000
```

## 🚀 النشر على Netlify
الخطوات الكاملة بملف **`DEPLOY_NETLIFY.md`** (قاعدة Neon + ربط GitHub + متغيرات البيئة). باختصار: ارفع على GitHub ← Netlify Import ← حط `DATABASE_URL` + `NEXTAUTH_SECRET` + `NEXTAUTH_URL` ← Deploy.
> ملاحظة: تحوّلت القاعدة لـ PostgreSQL لأن SQLite ما بتشتغل على Netlify السيرفرليس.
دخول: `admin@asmar.coffee / admin123` · `cashier@asmar.coffee / cashier123`

## التثبيت على الهاتف (Add to Home Screen)
1. شغّل المشروع وافتحو على الهاتف عبر **HTTPS** (PWA بتحتاج https؛ محلياً جرّب عبر نفق متل `ngrok` أو رفع على Vercel).
2. **Android/Chrome:** بيطلع زر «تثبيت» داخل التطبيق أو من قائمة المتصفح «Add to Home Screen».
3. **iPhone/Safari:** زر المشاركة ⬆️ ← «أضِف إلى الشاشة الرئيسية».
4. بينفتح **standalone** (بدون شريط المتصفح) متل تطبيق عادي.

> ملاحظة: على `localhost` بيشتغل الـ service worker للتجربة، بس التثبيت الحقيقي بيتطلب https (أو localhost على نفس الجهاز).

## PWA
- `public/manifest.json` — standalone, RTL, أيقونات (192/512/maskable), shortcuts.
- `public/sw.js` — service worker: network-first للصفحات + cache-first للأصول + صفحة `offline.html`. ما بيكاش الـ`/api` ولا عمليات الكتابة.
- `src/components/PWA.tsx` — تسجيل الـ SW + زر «تثبيت» (beforeinstallprompt) + إرشاد iOS.
- `viewport-fit=cover` + `env(safe-area-inset-*)` لاحترام نوتش الآيفون.

## الموبايل POS (سريع جداً)
- أزرار منتجات كبيرة (تاب = +1) مع badge للكمية، فلاتر فئات أفقية.
- **سلة ثابتة أسفل الشاشة** + زر **«بيع» بضغطة واحدة** + bottom-sheet لتعديل الكميات.
- **بيع بالصوت** 🎤: «بيع 2 لاتيه» بينفّذ مباشرة (Web Speech API).
- اهتزاز خفيف (haptic) عند الإضافة، و`active:scale` للمسة سريعة.

## المساعد (نص + صوت + كاميرا)
- زر عائم + يفتح **full-screen على الموبايل**.
- **كاميرا** 📷: زر «كاميرا» بيفتح كاميرا الهاتف مباشرة (`capture="environment"`) لتصوير الفاتورة → OCR (Tesseract.js) → تحديث مخزون؛ أو وضع «رفوف» → تنبيه نقص.
- المنطق بـ `src/lib/ai-router.ts` والتنفيذ بـ `src/app/api/ai/route.ts`.

## البنية
```
src/app/  pos  dashboard  inventory  products  ai-assistant  login  api/{ai,sales,inventory,products,dashboard,auth}
src/lib/  ai-router.ts  inventory.ts  analytics.ts  auth.ts  db.ts  utils.ts
src/components/  Shell.tsx  AIAssistant.tsx  PWA.tsx
public/  manifest.json  sw.js  offline.html  icons/
```

## التقنية
Next.js 14 (App Router) · TypeScript · TailwindCSS · Prisma · SQLite (قابل للتحويل لـ PostgreSQL) · NextAuth (JWT + roles) · Web Speech API · Tesseract.js · PWA/Service Worker.

## ترقيات اختيارية (البنية جاهزة لها)
Push notifications للنقص · offline POS كامل (queue + sync) · QR menu للزبائن · تنبيهات واتساب.

— Designed & developed by Omar Al Sabsabi — Sabsabi_AI ✦
