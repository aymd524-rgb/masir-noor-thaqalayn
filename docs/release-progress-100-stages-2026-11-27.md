# برنامهٔ تکمیل ۱۰۰ مرحله‌ای مسیر نور ثقلین
آخرین بازبینی: 2026-11-27

این فایل یک پیگیری صادقانه است، نه ادعای تکمیل ۱۰۰ مرحله. مراحل با شواهد قابل بررسی علامت می‌خورند. تغییرات GitHub به‌تنهایی به معنی انتشار سایت نیست.

## مرحلهٔ ۱ — بازبینی یکپارچه‌سازی گواهی‌ها
- [x] پنل گواهی دانش‌پژوه و استاد در داشبورد backend وارد شده است.
- [x] صدور/ابطال از RPC و بررسی دسترسی در دیتابیس طراحی شده است.
- [x] bucket امضای استاد خصوصی طراحی شده است.
- [x] PR #20 به‌صورت Draft ثبت شده است.
- [x] اجرای CI روی آخرین head PR #20 (run 46033448170)
- [ ] اجرای migration و آزمون‌های امنیتی در staging (هنوز انجام نشده)
- [ ] آزمایش چاپ فارسی/عربی روی Android (هنوز انجام نشده)

## مراحل ۲ تا ۱۰ — آماده‌سازی نسخهٔ آزمایشی
2. بررسی CI و رفع خطاهای build/test
3. بازبینی SQL migrationها با ترتیب وابستگی
4. اجرای migration مؤسسه‌ها در staging خالی
5. اجرای migration ثبت‌نام و تماس اختیاری
6. اجرای migration گواهی‌ها در staging
7. بررسی RLS برای مدیر مؤسسه
8. بررسی RLS برای استاد کلاس تخصیص‌یافته
9. بررسی جداسازی استاد/دانش‌پژوه مؤسسهٔ دیگر
10. تأیید preflight و تهیهٔ گزارش staging

## مراحل ۱۱ تا ۲۰ — ثبت‌نام و حساب کاربری
11. بررسی فرم شماره تلفن
12. بررسی ارسال و تأیید OTP با ارائه‌دهندهٔ واقعی
13. بررسی ایمیل اختیاری
14. بررسی ساخت پروفایل پس از ثبت‌نام
15. بررسی ورود و خروج
16. بررسی بازیابی/تغییر شماره در مسیر مجاز
17. بررسی محدودیت تلاش OTP
18. بررسی پیام خطای فارسی
19. بررسی حساب روی دو دستگاه
20. ثبت نتایج آزمون حساب

## مراحل ۲۱ تا ۳۰ — مؤسسه و عضویت
21. ایجاد مؤسسه توسط مدیر مجاز
22. درخواست عضویت دانش‌پژوه
23. تأیید/رد عضویت
24. تعلیق و فعال‌سازی مجدد عضویت
25. عضویت یک حساب در دو مؤسسه
26. تغییر مؤسسهٔ فعال بدون حساب تکراری
27. جداسازی فهرست دوره‌ها
28. جداسازی فهرست کلاس‌ها
29. بررسی نقش استاد در هر مؤسسه
30. ثبت نتایج آزمون چندمؤسسه‌ای

## مراحل ۳۱ تا ۴۰ — دوره، کلاس و ثبت‌نام
31. ایجاد دوره
32. ایجاد کلاس از دوره
33. اتصال کلاس به مؤسسه
34. تخصیص استاد فعال
35. درخواست ثبت‌نام دانش‌پژوه
36. تأیید ثبت‌نام از نقش مجاز
37. جلوگیری از ثبت‌نام تکراری
38. بررسی ظرفیت کلاس
39. بررسی وضعیت پرداخت برای دورهٔ پولی
40. ثبت گزارش ثبت‌نام

## مراحل ۴۱ تا ۵۰ — آموزش و گزارش
41. ثبت جلسه
42. حضور و غیاب
43. ثبت نمره
44. گزارش کارنامه
45. ثبت ارزیابی حفظ
46. ثبت ارزیابی مرور
47. برنامهٔ هفتگی حفظ
48. ثبت انجام تکلیف
49. گزارش پیشرفت دانش‌پژوه
50. بررسی دسترسی بین کلاس‌ها

## مراحل ۵۱ تا ۶۰ — گواهی
51. تنظیم عنوان سربرگ
52. تنظیم متن گواهی
53. بارگذاری امضای استاد
54. بررسی محدودیت نوع و حجم فایل
55. صدور گواهی با تأیید تکمیل
56. جلوگیری از صدور دوباره
57. ذخیرهٔ snapshot نام و عنوان دوره
58. چاپ گواهی دانش‌پژوه
59. ابطال گواهی و نمایش وضعیت
60. آزمون دسترسی به امضا و گواهی

## مراحل ۶۱ تا ۷۰ — مصحف حفظ
61. تأیید مجوز منبع صفحات مصحف
62. تنظیم secrets منبع در Edge Function
63. استقرار function در staging
64. بررسی صفحهٔ ۱
65. بررسی صفحهٔ ۲
66. بررسی یک صفحهٔ میانی
67. بررسی صفحهٔ ۶۰۴
68. بررسی دقیق ۱۵ سطر و ترتیب خطوط
69. بررسی نمایش عثمان طه روی موبایل
70. فعال‌سازی منبع فقط پس از تطبیق نمونه‌ها

## مراحل ۷۱ تا ۸۰ — محتوا و تجربهٔ کاربری
71. بررسی صفحهٔ اصلی
72. بررسی قرآن و جست‌وجو
73. بررسی ترجمه و تفسیر
74. بررسی ادعیه و بازشدن کامل متن
75. بررسی احادیث
76. بررسی بازی‌های قرآنی
77. بررسی داستان‌ها و تدبر
78. بررسی ادامهٔ مطلب و اسکرول
79. بررسی نمایش RTL و اعداد فارسی
80. بررسی دسترس‌پذیری پایه

## مراحل ۸۱ تا ۹۰ — امنیت و پایداری
81. فعال‌سازی محافظت رمزهای افشاشده در Auth
82. بازبینی نقش‌های مدیر
83. آزمون RPCهای مدیر با حساب غیرمدیر
84. بررسی سیاست‌های Storage
85. بررسی محدودیت نرخ OTP
86. بررسی خطاهای شبکه
87. بررسی حذف/ابطال و حفظ سابقه
88. بررسی پشتیبان‌گیری و بازیابی staging
89. رفع هشدارهای امنیتی با آزمون
90. تأیید گزارش امنیتی پیش از انتشار

## مراحل ۹۱ تا ۱۰۰ — انتشار
91. مرور کامل PRهای Draft و وابستگی‌ها
92. اجرای CI نهایی
93. بازبینی تغییرات توسط مالک پروژه
94. ادغام مرحله‌ای PRهای تأییدشده
95. اجرای migrationهای تأییدشده روی تولید با backup
96. تنظیم secrets تولید
97. استقرار Edge Functionهای لازم
98. انتشار وب و آزمون smoke test
99. بررسی نسخهٔ عمومی روی Android
100. اعلام انتشار فقط پس از تأیید عملکرد واقعی

## وضعیت فعلی
- PR #19 و PR #20 هنوز Draft و ادغام‌نشده‌اند.
- تغییرات فعلی روی شاخه‌های GitHub هستند؛ سایت عمومی به‌روزرسانی نشده است.
- مهاجرت تولید اجرا نشده است.
- پیامک OTP و مصحف دقیق ۱۵ خط هنوز end-to-end تأیید نشده‌اند.

## پیگیری تکمیلی (2026-11-27)
- [x] مرحلهٔ ۲: RPC صدور گواهی وضعیت ثبت‌نام `approved` را صریحاً بررسی می‌کند.
- [x] مرحلهٔ ۳: سیاست INSERT گواهی نیز وضعیت `approved` را به‌عنوان کنترل دفاعی دوم بررسی می‌کند.
- [x] برنامهٔ آزمون امنیتی برای هر دو کنترل به‌روزرسانی شد.
- [ ] CI و آزمون staging برای این اصلاحات هنوز تأیید نشده‌اند.


## تأیید CI یکپارچه (2026-11-27)
- [x] PR #19 head `a461f7e007952702540316580582edc7f2c2cdca`: run 46033411384 / #592 موفق؛ test و build موفق.
- [x] PR #20 head `e985381666fe6979f81d54a0dd0a8af91c68f931`: run 46033448170 / #593 موفق؛ test و build موفق.
- [x] توضیحات PR #19 با نتایج CI جدید و موانع انتشار به‌روزرسانی شد.
- [ ] آزمون دیتابیس/RLS در staging، پیامک واقعی، منبع مصحف ۱۵ خطی و چاپ Android هنوز انجام نشده‌اند.


## Staging test-plan preparation (2026-11-27)
- [x] Stage 8: corrected stale CI reporting in the integration validation record.
- [x] Added a staging acceptance checklist covering institute/RLS isolation, memberships, course/class/enrollment and capacity, phone OTP, contact privacy, certificate/signature security, and quiz membership scope.
- [x] PR #20 current head `a68850509a7d38a3bd60de036262078314b5b721` passed Build check run 46033772972 (#594), including `bun run test` and `bun run build`.
- [ ] PR #19 documentation head `e723fa6263b4a947bd2682ab637ba4beada0f7ed` awaits its own CI result; previous code head passed.
- [ ] Checklist execution against disposable staging Supabase is pending; no migrations or production changes were made.


## Staging evidence preparation (2026-11-27)
- [x] Stage 9: added `docs/staging-test-evidence-log-template-2026-11-27.md` to record test actor, expected/actual results, pass/fail, evidence, and migration execution separately.
- [x] Latest PR #20 head `7b807ee5aab4f0ea2e1bb6dd41a6a03c6854ec5d` passed Build check run 46033967999 (#597).
- [x] PR #19 checklist head `e723fa6263b4a947bd2682ab637ba4beada0f7ed` passed run 46033882036 (#596).
- [x] PR #19 evidence-template commit `521a8767dbb247296c33536639a4aa61d8d8a172` passed Build check run 46034070216 (#598).
- [ ] Staging evidence remains unfilled; no staging database execution or production deployment performed.


## CI follow-up (2026-11-27)
- [x] Stage 10: the staging evidence-log template commit passed GitHub Actions Build check #598 (run 46034070216).
- [x] The tracker and PR notes now reflect the successful CI result.
- [ ] This is still source-level CI only; staging evidence has not been collected and no migration was executed.


## Mushaf page navigation validation (2026-11-27)
- [x] Stage 11: page input now accepts Persian and Arabic-Indic digits and normalizes them before parsing.
- [x] Rejects empty, zero, non-numeric, and out-of-range page numbers (valid range 1–604); invalid submission restores the current page.
- [x] Added unit tests for digit normalization and range validation.
- [x] PR #19 integration head `80537dde3234b2abe6622848607aa1adfee3a040` passed Build check #606 (run 46034778439).
- [x] Earlier Mushaf input commit `126e794fe9b2c1c1a30eab6f63d4c2ad77bd5d63` passed Build check #603 (run 46034582514).
- [ ] This improves page navigation only; it does not supply or verify the complete fixed 15-line page data. Staging and publication remain pending.


## Revalidation after Mushaf integrity changes (2026-11-27)
- [x] PR #19 integration branch now includes source validation and tests for malformed Mushaf data; latest test commit `2e5fe49d265b909f81b46527a236a4f7071cc2ff` passed Build #612 (run 46039738412).
- [ ] PR #20 certificate integration must run CI again against the current PR #19 base before it is considered validated. Its previous successful Build #607 used an earlier base.
- [ ] Staging database, SMS delivery, Quran Foundation page source, and Android certificate print acceptance remain pending.
- No merge, production migration, or public deployment was performed.


## بازبینی مجدد وضعیت یکپارچه‌سازی (2026-11-27، به‌روزرسانی)
- [x] PR #19 آخرین head `02eef1f139373020d437239361c965395ebe9447` را در Build #615 (run 46040367375) با موفقیت گذراند؛ نصب وابستگی‌ها، تست‌ها و build موفق بودند.
- [x] PR #20 هنوز Draft است و head آن `3d24dae5d95349b73b54a34bd46989b5e463dad1` است.
- [ ] PR #20 هنوز بر پایهٔ SHA قدیمی `91694053d09adb61034ad82025b535f18e14521e` قرار دارد؛ Build #614 (run 46040031892) برای head قبلی موفق بود، اما تغییرات تازهٔ PR #19 را اعتبارسنجی نمی‌کند.
- [ ] لازم است شاخهٔ گواهی‌ها با آخرین تغییرات PR #19 هماهنگ و CI یکپارچهٔ جدید اجرا شود.
- [ ] staging، ارسال SMS واقعی، منبع کامل مصحف ۱۵ خطی، و چاپ گواهی روی Android همچنان تأیید نشده‌اند.
- هیچ PR ادغام نشده، migration تولید اجرا نشده و سایت عمومی در این مرحله منتشر/به‌روزرسانی نشده است.


## Sync of certificate branch with latest institute integration (2026-11-27)
- [x] Stage 12: synchronized PR #20 certificate work onto the latest PR #19 integration head `02eef1f139373020d437239361c965395ebe9447`.
- [x] Sync commit: `9c36006f709baa649e74bd5ad7375382a20c902d`; PR #20 now points to this merge commit.
- [x] GitHub Actions Build #617 (run `46042630682`) passed for the exact sync commit: dependency installation, application tests, and production build succeeded.
- [ ] Cloudflare preview deployment for the sync commit has not been confirmed; the preview bot still reports older commit `3d24dae`.
- [ ] Staging Supabase/RLS, actual SMS delivery, full verified 15-line Uthmani mushaf source, and Android certificate print acceptance remain pending.
- PR #20 remains Draft; no merge to main, live migration, or production deployment.


## Tracker CI verification (2026-11-27)
- [x] Stage 13: tracker update commit `f29d3ec128d5e43c07851760d0023738b299016e` passed Build #618 (run `46042793254`) for the exact SHA; dependency installation, application tests, and production build all succeeded.
- [ ] Cloudflare preview bot still reports latest deployed preview as commit `3d24dae`; the synced integration commit and tracker commit do not yet have a confirmed preview deployment.
- [ ] No staging validation or production deployment. Full fixed 15-line Mushaf source and real SMS acceptance remain unresolved.
