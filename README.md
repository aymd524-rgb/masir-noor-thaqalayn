# مسیر نور ثقلین

سامانه آموزش قرآن و معارف اهل‌بیت با رابط فارسی راست‌چین و طراحی موبایل‌محور.

## وضعیت پروژه

- مخزن GitHub شاخه `main` مرجع نسخه‌های کد این پروژه است.
- ساخت برنامه با GitHub Actions بررسی می‌شود.
- اتصال برنامه به Supabase از طریق متغیرهای محیطی انجام می‌شود.
- اگر متغیرهای Supabase تنظیم نشده باشند، برنامه در حالت نمایشی (Demo) اجرا می‌شود.
- اتصال دوطرفه و خودکار Lovable و GitHub را نباید مفروض دانست؛ پیش از هر ویرایش در Lovable، آخرین commit و وضعیت همگام‌سازی را بررسی کنید.

## اجرای محلی

به Node.js و npm یا Bun نیاز دارید:

```bash
git clone https://github.com/aymd524-rgb/masir-noor-thaqalayn.git
cd masir-noor-thaqalayn
cp .env.example .env
npm install
npm run dev
```

مقادیر واقعی را فقط در فایل محلی `.env` یا بخش امن Environment Variables میزبان وارد کنید. فایل `.env` را به GitHub ارسال نکنید.

## اتصال به Supabase

متغیرهای زیر لازم‌اند:

- `VITE_SUPABASE_URL`: آدرس پروژه Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY`: کلید عمومی Publishable پروژه

کلید Publishable برای کد سمت مرورگر طراحی شده است؛ با این حال، امنیت داده‌ها باید با احراز هویت و سیاست‌های RLS تأمین شود. هرگز کلید `service_role` یا `sb_secret` را در مرورگر، فایل‌های پروژه یا GitHub قرار ندهید.

راهنمای جزئی‌تر در [docs/SETUP.md](docs/SETUP.md) است.

## فرمان‌ها

```bash
npm run dev
npm run build
npm run lint
npm test
```

## فناوری‌ها

- TanStack Start و TanStack Router
- React و TypeScript
- Tailwind CSS
- Supabase
