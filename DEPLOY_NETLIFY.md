# 🚀 نشر Asmar POS على Netlify — خطوة بخطوة

> ⚠️ مهم: Netlify Drop (السحب) **ما بيزبط** لهالمشروع. هاد تطبيق Next.js كامل، بدّو بناء عبر GitHub + قاعدة PostgreSQL مستضافة.

## 1) جهّز قاعدة بيانات Postgres مجانية (Neon)
1. روح على https://neon.tech ← Sign up (مجاني).
2. اعمل Project جديد ← بياخد منك **Connection string** شكلو:
   `postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require`
3. احفظو — هاد بيصير `DATABASE_URL`.
   (بدائل: Supabase أو إضافة "Prisma Postgres" من Netlify.)

## 2) جهّز قاعدة البيانات وأول migration (مرة وحدة من جهازك)
بملف `.env` المحلي حطّ نفس الـ Neon URL، وبعدين:
```bash
npm install
npx prisma migrate dev --name init     # ينشئ الجداول على Neon
npm run seed                            # يعبّي المستخدمين والمنتجات (مرة وحدة)
```

## 3) ارفع المشروع على GitHub
```bash
git init
git add .
git commit -m "Asmar POS PWA"
git branch -M main
git remote add origin https://github.com/<username>/asmar-pos.git
git push -u origin main
```
(`.env` محمي بالـ.gitignore — ما بينرفع، وهاد صح.)

## 4) اربطو بـ Netlify
1. https://app.netlify.com ← **Add new site** ← **Import an existing project** ← GitHub ← اختار الريبو.
2. Netlify بيتعرّف على Next.js تلقائياً. الـ **Build command** موجود بـ `netlify.toml`:
   `prisma generate && prisma migrate deploy && next build`
3. قبل ما تضغط Deploy، روح **Site settings ← Environment variables** وحط:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | الرابط تبع Neon |
   | `NEXTAUTH_SECRET` | ولّدو: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://<site-name>.netlify.app` |
4. اضغط **Deploy**. أول بناء بياخد دقيقتين-تلاتة.

## 5) جرّب
- افتح `https://<site-name>.netlify.app` ← بيفتح على `/pos`.
- سجّل دخول: `admin@asmar.coffee / admin123`.
- على الهاتف: بيطلعلك زر **«تثبيت»** أو من Safari «أضِف للشاشة الرئيسية» ← بيشتغل متل تطبيق.

## تنبيهات
- بعد ما تغيّر `NEXTAUTH_URL` أو أي env: من Netlify اعمل **Trigger deploy ← Clear cache and deploy site**.
- ميكروفون/كاميرا بيشتغلوا بس على **HTTPS** — Netlify بيعطيك https تلقائياً ✅.
- إذا طلع خطأ Prisma بالبناء: تأكد `postinstall: prisma generate` موجود (موجود) وإنّو `DATABASE_URL` مظبوط.
- للسيرفرليس، يُفضّل **connection pooling**: استعمل رابط Neon **pooled** (فيه `-pooler`) لـ`DATABASE_URL`.
