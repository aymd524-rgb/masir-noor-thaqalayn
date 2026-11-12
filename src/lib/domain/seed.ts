import type { Db } from "./types";

/** Password shared by every demo account (demo mode only). */
export const DEMO_PASSWORD = "noor1234";

export const DEMO_ACCOUNTS = [
  { role: "student" as const, email: "student@masirnoor.ir", label: "دانش‌پژوه" },
  { role: "teacher" as const, email: "teacher@masirnoor.ir", label: "استاد / مربی" },
  { role: "admin" as const, email: "admin@masirnoor.ir", label: "مدیر سامانه" },
];

export const DB_VERSION = 1;

export function createSeed(): Db {
  const users: Db["users"] = [
    { id: "u-admin", fullName: "سید مهدی حسینی", email: "admin@masirnoor.ir", role: "admin", phone: "09121234567", city: "قم", active: true, joinedAt: "2025-09-01T08:00:00Z", bio: "مدیر و هماهنگ‌کننده آموزشی مسیر نور ثقلین" },
    { id: "u-t1", fullName: "استاد محمدرضا کریمی", email: "teacher@masirnoor.ir", role: "teacher", phone: "09131112233", city: "اصفهان", active: true, joinedAt: "2025-09-10T08:00:00Z", bio: "مدرس تجوید و حفظ قرآن کریم با ۱۵ سال سابقه" },
    { id: "u-t2", fullName: "خانم زهرا موسوی", email: "zahra.mousavi@masirnoor.ir", role: "teacher", phone: "09141113344", city: "مشهد", active: true, joinedAt: "2025-10-02T08:00:00Z", bio: "پژوهشگر نهج‌البلاغه و صحیفه سجادیه" },
    { id: "u-s1", fullName: "علی رضایی", email: "student@masirnoor.ir", role: "student", phone: "09351234567", city: "تهران", active: true, joinedAt: "2026-01-15T08:00:00Z" },
    { id: "u-s2", fullName: "فاطمه احمدی", email: "fatemeh.ahmadi@example.com", role: "student", city: "شیراز", active: true, joinedAt: "2026-02-03T08:00:00Z" },
    { id: "u-s3", fullName: "حسین نوری", email: "hossein.noori@example.com", role: "student", city: "تبریز", active: true, joinedAt: "2026-03-11T08:00:00Z" },
    { id: "u-s4", fullName: "مریم صادقی", email: "maryam.sadeghi@example.com", role: "student", city: "یزد", active: true, joinedAt: "2026-04-20T08:00:00Z" },
    { id: "u-s5", fullName: "امیرحسین جعفری", email: "amir.jafari@example.com", role: "student", city: "کرج", active: false, joinedAt: "2026-06-01T08:00:00Z" },
  ];

  const demoCredentials: Record<string, string> = {};
  for (const u of users) demoCredentials[u.email] = DEMO_PASSWORD;

  return {
    version: DB_VERSION,
    users,
    demoCredentials,
    courses: [
      { id: "c1", title: "تجوید مقدماتی قرآن کریم", category: "quran", description: "آشنایی با مخارج حروف، صفات حروف، احکام نون ساکن و تنوین و قواعد مد؛ همراه با تمرین عملی تلاوت.", teacherId: "u-t1", level: "beginner", schedule: "شنبه و دوشنبه — ساعت ۱۷:۰۰", capacity: 20, durationWeeks: 10, startDate: "2026-10-03T13:30:00Z", published: true, createdAt: "2026-09-01T08:00:00Z" },
      { id: "c2", title: "حفظ جزء سی‌ام", category: "quran", description: "برنامه حفظ گام‌به‌گام سوره‌های جزء سی‌ام با روش تکرار و مرور هفتگی و آشنایی با مفاهیم سوره‌ها.", teacherId: "u-t1", level: "intermediate", schedule: "یکشنبه و سه‌شنبه — ساعت ۱۸:۳۰", capacity: 15, durationWeeks: 16, startDate: "2026-10-11T15:00:00Z", published: true, createdAt: "2026-09-05T08:00:00Z" },
      { id: "c3", title: "شرح خطبه‌های نهج‌البلاغه", category: "nahj", description: "خوانش و شرح خطبه‌های منتخب نهج‌البلاغه با تمرکز بر خطبه متقین، خطبه شقشقیه و نامه به مالک اشتر.", teacherId: "u-t2", level: "intermediate", schedule: "چهارشنبه — ساعت ۲۰:۰۰", capacity: 30, durationWeeks: 12, startDate: "2026-09-23T16:30:00Z", published: true, createdAt: "2026-08-20T08:00:00Z" },
      { id: "c4", title: "سیری در صحیفه سجادیه", category: "sahifa", description: "شرح و تدبر در دعاهای منتخب صحیفه سجادیه؛ دعای مکارم الاخلاق، دعا برای پدر و مادر و دعای روز عرفه.", teacherId: "u-t2", level: "beginner", schedule: "پنجشنبه — ساعت ۱۰:۰۰", capacity: 25, durationWeeks: 8, startDate: "2026-10-08T06:30:00Z", published: true, createdAt: "2026-09-10T08:00:00Z" },
      { id: "c5", title: "سیره اهل‌بیت علیهم‌السلام", category: "ahlulbayt", description: "مروری بر زندگی، سیره عملی و سخنان چهارده معصوم علیهم‌السلام برای زندگی امروز.", teacherId: "u-t1", level: "beginner", schedule: "جمعه — ساعت ۹:۰۰", capacity: 40, durationWeeks: 6, startDate: "2026-08-07T05:30:00Z", published: true, createdAt: "2026-07-15T08:00:00Z" },
      { id: "c6", title: "مفاهیم قرآن برای نوجوانان", category: "akhlagh", description: "آموزش مفاهیم اخلاقی قرآن با زبان ساده، داستان و فعالیت گروهی ویژه نوجوانان ۱۲ تا ۱۶ سال.", teacherId: "u-t2", level: "beginner", schedule: "دوشنبه — ساعت ۱۶:۰۰", capacity: 18, durationWeeks: 8, startDate: "2026-12-01T12:30:00Z", published: false, createdAt: "2026-11-01T08:00:00Z" },
    ],
    lessons: [
      { id: "l1", courseId: "c1", title: "مخارج حروف — بخش اول", summary: "حروف حلقی و حروف لهوی", order: 1, date: "2026-10-03T13:30:00Z", durationMin: 75 },
      { id: "l2", courseId: "c1", title: "مخارج حروف — بخش دوم", summary: "حروف شجری، اسلی و شفوی", order: 2, date: "2026-10-05T13:30:00Z", durationMin: 75 },
      { id: "l3", courseId: "c1", title: "احکام نون ساکن و تنوین", summary: "اظهار، ادغام، اقلاب و اخفاء", order: 3, date: "2026-10-10T13:30:00Z", durationMin: 90 },
      { id: "l4", courseId: "c1", title: "قواعد مد", summary: "مد طبیعی، مد متصل، مد منفصل و مد لازم", order: 4, date: "2026-10-12T13:30:00Z", durationMin: 90 },
      { id: "l5", courseId: "c2", title: "سوره نبأ", summary: "حفظ آیات ۱ تا ۲۰ و مرور معنا", order: 1, date: "2026-10-11T15:00:00Z", durationMin: 60 },
      { id: "l6", courseId: "c2", title: "سوره نبأ — ادامه", summary: "حفظ آیات ۲۱ تا ۴۰", order: 2, date: "2026-10-13T15:00:00Z", durationMin: 60 },
      { id: "l7", courseId: "c3", title: "خطبه متقین (همام)", summary: "صفات پرهیزگاران از زبان امیرالمؤمنین (ع)", order: 1, date: "2026-09-23T16:30:00Z", durationMin: 90 },
      { id: "l8", courseId: "c3", title: "نامه به مالک اشتر", summary: "اصول حکمرانی و مهربانی با مردم", order: 2, date: "2026-09-30T16:30:00Z", durationMin: 90 },
      { id: "l9", courseId: "c3", title: "حکمت‌های کوتاه", summary: "منتخب حکمت‌ها درباره علم و ارزش انسان", order: 3, date: "2026-10-07T16:30:00Z", durationMin: 60 },
      { id: "l10", courseId: "c4", title: "دعای اول: ستایش خداوند", summary: "معرفت خدا در آغاز صحیفه", order: 1, date: "2026-10-08T06:30:00Z", durationMin: 60 },
      { id: "l11", courseId: "c4", title: "دعای مکارم الاخلاق", summary: "منشور اخلاقی امام سجاد (ع)", order: 2, date: "2026-10-15T06:30:00Z", durationMin: 75 },
      { id: "l12", courseId: "c5", title: "سیره پیامبر اکرم (ص)", summary: "اخلاق نبوی در خانواده و جامعه", order: 1, date: "2026-08-07T05:30:00Z", durationMin: 60 },
      { id: "l13", courseId: "c5", title: "امیرالمؤمنین علی (ع)", summary: "عدالت و زهد علوی", order: 2, date: "2026-08-14T05:30:00Z", durationMin: 60 },
    ],
    materials: [
      { id: "m1", courseId: "c1", title: "جزوه مخارج حروف", type: "pdf", fileName: "makharej-horoof.pdf", sizeKb: 1840, uploadedAt: "2026-10-02T10:00:00Z", uploadedBy: "u-t1" },
      { id: "m2", courseId: "c1", title: "فایل صوتی تمرین تلاوت سوره حمد", type: "audio", fileName: "hamd-tamrin.mp3", sizeKb: 5120, uploadedAt: "2026-10-04T10:00:00Z", uploadedBy: "u-t1" },
      { id: "m3", courseId: "c3", title: "متن کامل خطبه متقین با ترجمه", type: "pdf", fileName: "khotbe-mottaghin.pdf", sizeKb: 920, uploadedAt: "2026-09-22T10:00:00Z", uploadedBy: "u-t2" },
      { id: "m4", courseId: "c4", title: "شرح صوتی دعای مکارم الاخلاق", type: "audio", fileName: "makarem-sharh.mp3", sizeKb: 14200, uploadedAt: "2026-10-14T10:00:00Z", uploadedBy: "u-t2" },
    ],
    enrollments: [
      { id: "e1", courseId: "c1", studentId: "u-s1", status: "approved", requestedAt: "2026-09-12T08:00:00Z", decidedAt: "2026-09-13T08:00:00Z", progress: 60 },
      { id: "e2", courseId: "c3", studentId: "u-s1", status: "approved", requestedAt: "2026-09-15T08:00:00Z", decidedAt: "2026-09-16T08:00:00Z", progress: 35 },
      { id: "e3", courseId: "c4", studentId: "u-s1", status: "pending", requestedAt: "2026-11-05T08:00:00Z", progress: 0, note: "علاقه‌مند به شرکت در کلاس حضوری هستم." },
      { id: "e4", courseId: "c5", studentId: "u-s1", status: "approved", requestedAt: "2026-07-20T08:00:00Z", decidedAt: "2026-07-21T08:00:00Z", progress: 100 },
      { id: "e5", courseId: "c1", studentId: "u-s2", status: "approved", requestedAt: "2026-09-12T09:00:00Z", decidedAt: "2026-09-13T09:00:00Z", progress: 80 },
      { id: "e6", courseId: "c2", studentId: "u-s2", status: "pending", requestedAt: "2026-11-06T09:00:00Z", progress: 0 },
      { id: "e7", courseId: "c1", studentId: "u-s3", status: "approved", requestedAt: "2026-09-18T09:00:00Z", decidedAt: "2026-09-19T09:00:00Z", progress: 20 },
      { id: "e8", courseId: "c3", studentId: "u-s3", status: "rejected", requestedAt: "2026-09-20T09:00:00Z", decidedAt: "2026-09-21T09:00:00Z", progress: 0, note: "ظرفیت کلاس حضوری تکمیل بود." },
      { id: "e9", courseId: "c4", studentId: "u-s4", status: "approved", requestedAt: "2026-09-28T09:00:00Z", decidedAt: "2026-09-29T09:00:00Z", progress: 50 },
      { id: "e10", courseId: "c5", studentId: "u-s5", status: "pending", requestedAt: "2026-11-08T09:00:00Z", progress: 0 },
    ],
    attendance: [
      { id: "a1", courseId: "c1", lessonId: "l1", studentId: "u-s1", status: "present" },
      { id: "a2", courseId: "c1", lessonId: "l2", studentId: "u-s1", status: "late" },
      { id: "a3", courseId: "c1", lessonId: "l3", studentId: "u-s1", status: "present" },
      { id: "a4", courseId: "c1", lessonId: "l1", studentId: "u-s2", status: "present" },
      { id: "a5", courseId: "c1", lessonId: "l2", studentId: "u-s2", status: "present" },
      { id: "a6", courseId: "c1", lessonId: "l3", studentId: "u-s2", status: "excused" },
      { id: "a7", courseId: "c1", lessonId: "l1", studentId: "u-s3", status: "absent" },
      { id: "a8", courseId: "c1", lessonId: "l2", studentId: "u-s3", status: "present" },
      { id: "a9", courseId: "c3", lessonId: "l7", studentId: "u-s1", status: "present" },
      { id: "a10", courseId: "c3", lessonId: "l8", studentId: "u-s1", status: "absent" },
    ],
    grades: [
      { id: "g1", courseId: "c1", studentId: "u-s1", title: "آزمون مخارج حروف", score: 17, max: 20, date: "2026-10-06T10:00:00Z" },
      { id: "g2", courseId: "c1", studentId: "u-s1", title: "تکلیف تلاوت سوره حمد", score: 18.5, max: 20, date: "2026-10-11T10:00:00Z" },
      { id: "g3", courseId: "c1", studentId: "u-s2", title: "آزمون مخارج حروف", score: 19, max: 20, date: "2026-10-06T10:00:00Z" },
      { id: "g4", courseId: "c1", studentId: "u-s3", title: "آزمون مخارج حروف", score: 14, max: 20, date: "2026-10-06T10:00:00Z" },
      { id: "g5", courseId: "c3", studentId: "u-s1", title: "خلاصه‌نویسی خطبه متقین", score: 15, max: 20, date: "2026-09-29T10:00:00Z" },
      { id: "g6", courseId: "c5", studentId: "u-s1", title: "آزمون پایانی", score: 92, max: 100, date: "2026-09-12T10:00:00Z" },
    ],
    quizzes: [
      {
        id: "q1", title: "آزمون تجوید — مرحله اول", description: "سنجش آموخته‌های جلسات اول تا سوم کلاس تجوید مقدماتی.", courseId: "c1", createdBy: "u-t1", timeLimitMin: 10, open: true, isCompetition: false, createdAt: "2026-10-12T08:00:00Z",
        questions: [
          { id: "q1-1", text: "حروف قلقله کدام‌اند؟", options: ["ق، ط، ب، ج، د", "ا، و، ی", "م، ن", "ر، ل"], answerIndex: 0 },
          { id: "q1-2", text: "حکم «نون ساکن» پیش از حرف «ب» چیست؟", options: ["اظهار", "ادغام", "اقلاب", "اخفاء"], answerIndex: 2 },
          { id: "q1-3", text: "حروف حلقی چند حرف هستند؟", options: ["چهار", "شش", "هشت", "ده"], answerIndex: 1 },
          { id: "q1-4", text: "مد لازم معمولاً به اندازه چند حرکت کشیده می‌شود؟", options: ["دو", "چهار", "شش", "هشت"], answerIndex: 2 },
          { id: "q1-5", text: "حروف «یرملون» مربوط به کدام حکم‌اند؟", options: ["اظهار", "ادغام", "قلقله", "تفخیم"], answerIndex: 1 },
        ],
      },
      {
        id: "q2", title: "مسابقه نهج‌البلاغه", description: "مسابقه عمومی آشنایی با نهج‌البلاغه؛ ویژه همه کاربران.", createdBy: "u-t2", timeLimitMin: 8, open: true, isCompetition: true, createdAt: "2026-10-20T08:00:00Z",
        questions: [
          { id: "q2-1", text: "گردآورنده نهج‌البلاغه کیست؟", options: ["شیخ صدوق", "سید رضی", "علامه مجلسی", "شیخ طوسی"], answerIndex: 1 },
          { id: "q2-2", text: "نهج‌البلاغه از چند بخش اصلی تشکیل شده است؟", options: ["دو", "سه", "چهار", "پنج"], answerIndex: 1 },
          { id: "q2-3", text: "نامه معروف امام علی (ع) به مالک اشتر، هنگام سپردن حکومت کدام سرزمین نوشته شد؟", options: ["کوفه", "یمن", "مصر", "شام"], answerIndex: 2 },
          { id: "q2-4", text: "خطبه شقشقیه در کدام بخش نهج‌البلاغه آمده است؟", options: ["خطبه‌ها", "نامه‌ها", "حکمت‌ها", "هیچ‌کدام"], answerIndex: 0 },
        ],
      },
      {
        id: "q3", title: "مسابقه آشنایی با اهل‌بیت (ع)", description: "پرسش‌هایی درباره زندگی و آثار اهل‌بیت علیهم‌السلام.", createdBy: "u-admin", timeLimitMin: 10, open: true, isCompetition: true, createdAt: "2026-11-01T08:00:00Z",
        questions: [
          { id: "q3-1", text: "حدیث ثقلین به کدام دو یادگار گرانبها اشاره دارد؟", options: ["نماز و روزه", "کتاب خدا و عترت", "علم و عمل", "حج و جهاد"], answerIndex: 1 },
          { id: "q3-2", text: "امام هشتم شیعیان کیست؟", options: ["امام کاظم (ع)", "امام جواد (ع)", "امام رضا (ع)", "امام صادق (ع)"], answerIndex: 2 },
          { id: "q3-3", text: "صحیفه سجادیه از کدام امام به یادگار مانده است؟", options: ["امام سجاد (ع)", "امام باقر (ع)", "امام حسن (ع)", "امام هادی (ع)"], answerIndex: 0 },
          { id: "q3-4", text: "لقب «باقرالعلوم» از آنِ کدام امام است؟", options: ["امام صادق (ع)", "امام محمد باقر (ع)", "امام علی (ع)", "امام حسین (ع)"], answerIndex: 1 },
          { id: "q3-5", text: "واقعه عاشورا در چه سالی رخ داد؟", options: ["۱۱ هجری قمری", "۴۰ هجری قمری", "۶۱ هجری قمری", "۱۴۵ هجری قمری"], answerIndex: 2 },
        ],
      },
    ],
    attempts: [
      { id: "at1", quizId: "q2", userId: "u-s2", score: 4, total: 4, at: "2026-10-22T10:00:00Z" },
      { id: "at2", quizId: "q2", userId: "u-s1", score: 3, total: 4, at: "2026-10-23T10:00:00Z" },
      { id: "at3", quizId: "q3", userId: "u-s4", score: 5, total: 5, at: "2026-11-02T10:00:00Z" },
      { id: "at4", quizId: "q3", userId: "u-s3", score: 3, total: 5, at: "2026-11-03T10:00:00Z" },
      { id: "at5", quizId: "q1", userId: "u-s1", score: 4, total: 5, at: "2026-10-13T10:00:00Z" },
    ],
    messages: [
      { id: "msg1", fromId: "u-t1", toId: "u-s1", subject: "تمرین جلسه بعد", body: "سلام علیکم. لطفاً برای جلسه بعد سوره قدر را با رعایت احکام نون ساکن تمرین کنید و فایل صوتی آن را ارسال نمایید.", at: "2026-11-08T14:00:00Z", read: false },
      { id: "msg2", fromId: "u-s1", toId: "u-t1", subject: "سؤال درباره اخفاء", body: "سلام استاد. در اخفاء، صدای نون باید کاملاً از بین برود یا غنه باقی می‌ماند؟", at: "2026-11-07T18:20:00Z", read: true },
      { id: "msg3", fromId: "u-admin", toId: "u-s1", subject: "خوش‌آمدگویی", body: "به سامانه مسیر نور ثقلین خوش آمدید. از طریق بخش دوره‌ها می‌توانید در کلاس‌های جدید ثبت‌نام کنید.", at: "2026-01-15T09:00:00Z", read: true },
      { id: "msg4", fromId: "u-s2", toId: "u-t1", subject: "غیبت جلسه سوم", body: "سلام. به دلیل بیماری در جلسه سوم حضور نداشتم. ممنون می‌شوم جزوه آن جلسه را معرفی بفرمایید.", at: "2026-10-10T19:00:00Z", read: false },
    ],
    certificates: [
      { id: "cert1", courseId: "c5", studentId: "u-s1", issuedAt: "2026-09-20T10:00:00Z", code: "MNS-1405-0172" },
    ],
    content: [
      // Quran
      { id: "ct-q1", section: "quran", title: "سوره حمد (فاتحة الکتاب)", subtitle: "سوره ۱ — ۷ آیه — مکی", tag: "سوره", arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", body: "به نام خداوند بخشنده مهربان. ستایش مخصوص خداوندی است که پروردگار جهانیان است؛ بخشنده و مهربان؛ مالک روز جزا. تنها تو را می‌پرستیم و تنها از تو یاری می‌جوییم. ما را به راه راست هدایت کن؛ راه کسانی که به آنان نعمت دادی، نه راه غضب‌شدگان و نه گمراهان.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-q2", section: "quran", title: "سوره توحید (اخلاص)", subtitle: "سوره ۱۱۲ — ۴ آیه", tag: "سوره", arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", body: "بگو: او خدای یکتاست؛ خدایی که همه نیازمندان قصد او می‌کنند. نه زاده و نه زاده شده است، و هیچ کس همتای او نیست.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-q3", section: "quran", title: "سوره عصر", subtitle: "سوره ۱۰۳ — ۳ آیه", tag: "سوره", arabic: "وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ", body: "سوگند به عصر، که انسان‌ها همه در زیانند؛ مگر کسانی که ایمان آورده و کارهای شایسته انجام داده‌اند و یکدیگر را به حق و صبر سفارش کرده‌اند.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-q4", section: "quran", title: "آشنایی با مخارج حروف", subtitle: "درس تجوید", tag: "تجوید", body: "مخرج، محل خروج صدای هر حرف است. مخارج حروف عربی در پنج ناحیه اصلی قرار دارند: جوف (فضای دهان و حلق)، حلق، زبان، لب‌ها و خیشوم (بینی). شناخت دقیق مخارج، پایه تلاوت صحیح قرآن کریم است.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      // Ahlul Bayt
      { id: "ct-a1", section: "ahlulbayt", title: "حدیث ثقلین", subtitle: "از پیامبر اکرم (ص)", tag: "حدیث", arabic: "إِنِّي تَارِكٌ فِيكُمُ الثَّقَلَيْنِ: كِتَابَ اللَّهِ وَعِتْرَتِي أَهْلَ بَيْتِي", body: "من در میان شما دو چیز گرانبها به یادگار می‌گذارم: کتاب خدا و عترتم، اهل‌بیتم. این دو هرگز از یکدیگر جدا نمی‌شوند. نام «ثقلین» در عنوان این سامانه برگرفته از همین حدیث شریف است.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-a2", section: "ahlulbayt", title: "امیرالمؤمنین علی (ع)", subtitle: "امام اول", tag: "زندگی‌نامه", body: "امام علی بن ابی‌طالب (ع) در سیزدهم رجب در خانه کعبه به دنیا آمد. ایشان نخستین مردی بود که به پیامبر ایمان آورد و در عدالت، دانش، شجاعت و زهد الگوی بی‌همتای تاریخ است. سخنان و نامه‌های ایشان در کتاب نهج‌البلاغه گرد آمده است.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-a3", section: "ahlulbayt", title: "حضرت فاطمه زهرا (س)", subtitle: "سیدة نساء العالمین", tag: "زندگی‌نامه", body: "حضرت فاطمه (س) دختر گرامی پیامبر اکرم (ص) و همسر امیرالمؤمنین (ع) است. زندگی ایشان سرشار از عبادت، ایثار و دفاع از حق بود و خطبه فدکیه از ماندگارترین یادگارهای ایشان است.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-a4", section: "ahlulbayt", title: "امام حسین (ع)", subtitle: "سیدالشهدا", tag: "زندگی‌نامه", body: "امام حسین (ع) در سال ۶۱ هجری قمری در سرزمین کربلا برای احیای دین و امر به معروف و نهی از منکر به شهادت رسید. قیام عاشورا درس آزادگی، عزت و ایستادگی در برابر ستم است.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      // Nahj al-Balagha
      { id: "ct-n1", section: "nahj", title: "ارزش هر انسان", subtitle: "از حکمت‌های نهج‌البلاغه", tag: "حکمت", arabic: "قِيمَةُ كُلِّ امْرِئٍ مَا يُحْسِنُهُ", body: "ارزش هر کس به اندازه کاری است که آن را به‌خوبی انجام می‌دهد.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-n2", section: "nahj", title: "دشمنی با ناآگاهی", subtitle: "از حکمت‌های نهج‌البلاغه", tag: "حکمت", arabic: "النَّاسُ أَعْدَاءُ مَا جَهِلُوا", body: "مردم دشمن چیزی هستند که نمی‌دانند.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-n3", section: "nahj", title: "مهربانی با مردم", subtitle: "از نامه امام علی (ع) به مالک اشتر", tag: "نامه", arabic: "وَأَشْعِرْ قَلْبَكَ الرَّحْمَةَ لِلرَّعِيَّةِ وَالْمَحَبَّةَ لَهُمْ وَاللُّطْفَ بِهِمْ", body: "قلب خود را از مهربانی، محبت و لطف به مردم سرشار کن. این نامه منشور جامع حکمرانی عادلانه و مردمی است.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-n4", section: "nahj", title: "خطبه متقین", subtitle: "پاسخ امام به درخواست همام", tag: "خطبه", body: "همام از یاران امیرالمؤمنین (ع) خواست صفات پرهیزگاران را برایش بیان کند. امام در این خطبه بیش از صد ویژگی برای متقین برمی‌شمارد؛ از راستگویی و میانه‌روی در پوشش تا فروتنی در رفتار.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      // Sahifa
      { id: "ct-s1", section: "sahifa", title: "دعای اول: ستایش پروردگار", subtitle: "صحیفه سجادیه", tag: "دعا", arabic: "الْحَمْدُ لِلَّهِ الْأَوَّلِ بِلَا أَوَّلٍ كَانَ قَبْلَهُ، وَالْآخِرِ بِلَا آخِرٍ يَكُونُ بَعْدَهُ", body: "ستایش خدایی را که اوّل است، بی‌آنکه پیش از او اوّلی باشد؛ و آخر است، بی‌آنکه پس از او آخری باشد.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-s2", section: "sahifa", title: "دعای مکارم الاخلاق", subtitle: "دعای بیستم صحیفه سجادیه", tag: "دعا", arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِهِ، وَبَلِّغْ بِإِيمَانِي أَكْمَلَ الْإِيمَانِ، وَاجْعَلْ يَقِينِي أَفْضَلَ الْيَقِينِ", body: "خدایا بر محمد و آلش درود فرست، و ایمانم را به کامل‌ترین ایمان برسان و یقینم را برترین یقین قرار ده. این دعا منشوری کامل برای تربیت اخلاقی است.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-s3", section: "sahifa", title: "دعا برای پدر و مادر", subtitle: "دعای بیست‌وچهارم صحیفه سجادیه", tag: "دعا", body: "امام سجاد (ع) در این دعا ادب و احسان به پدر و مادر را به زیباترین شکل به ما می‌آموزد و از خداوند می‌خواهد که توفیق نیکی به آنان را عطا کند.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      // Duas & Ziyarat
      { id: "ct-d1", section: "duas", title: "دعای کمیل", subtitle: "شب‌های جمعه", tag: "دعا", arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ بِرَحْمَتِكَ الَّتِي وَسِعَتْ كُلَّ شَيْءٍ", body: "خدایا از تو درخواست می‌کنم به رحمتت که همه چیز را فرا گرفته است. این دعا را امیرالمؤمنین (ع) به کمیل بن زیاد آموخت.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-d2", section: "duas", title: "دعای فرج", subtitle: "دعای امام زمان (عج)", tag: "دعا", arabic: "إِلَهِي عَظُمَ الْبَلَاءُ وَبَرِحَ الْخَفَاءُ وَانْكَشَفَ الْغِطَاءُ", body: "خدایا گرفتاری بزرگ شد و پنهان آشکار گشت و پرده کنار رفت.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-d3", section: "duas", title: "زیارت عاشورا", subtitle: "زیارت امام حسین (ع)", tag: "زیارت", arabic: "السَّلَامُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ، السَّلَامُ عَلَيْكَ يَا ابْنَ رَسُولِ اللَّهِ", body: "سلام بر تو ای اباعبدالله، سلام بر تو ای فرزند رسول خدا.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-d4", section: "duas", title: "زیارت امین‌الله", subtitle: "زیارت جامعه کوتاه", tag: "زیارت", arabic: "السَّلَامُ عَلَيْكَ يَا أَمِينَ اللَّهِ فِي أَرْضِهِ وَحُجَّتَهُ عَلَى عِبَادِهِ", body: "سلام بر تو ای امین خدا در زمینش و حجت او بر بندگانش.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      // Library
      { id: "ct-l1", section: "library", title: "نهج‌البلاغه", subtitle: "خطبه‌ها، نامه‌ها و حکمت‌های امام علی (ع)", author: "گردآوری: سید رضی", tag: "حدیث", body: "مجموعه‌ای از سخنان امیرالمؤمنین علی (ع) در سه بخش خطبه‌ها، نامه‌ها و حکمت‌ها که در قرن چهارم هجری گردآوری شد.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-l2", section: "library", title: "صحیفه سجادیه", subtitle: "زبور آل محمد (ص)", author: "امام سجاد (ع)", tag: "دعا", body: "مجموعه دعاهای امام زین‌العابدین (ع) که دریایی از معارف توحیدی و اخلاقی را در قالب نیایش بیان می‌کند.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-l3", section: "library", title: "مفاتیح‌الجنان", subtitle: "مجموعه ادعیه و زیارات", author: "شیخ عباس قمی", tag: "دعا", body: "پرکاربردترین کتاب دعا و زیارت در میان فارسی‌زبانان، شامل اعمال ماه‌ها، دعاها و زیارت‌نامه‌ها.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-l4", section: "library", title: "داستان راستان", subtitle: "داستان‌های اخلاقی", author: "شهید مرتضی مطهری", tag: "اخلاق", body: "مجموعه‌ای از داستان‌های کوتاه و آموزنده از زندگی پیامبر و اهل‌بیت (ع) و بزرگان، با نثری ساده و شیوا.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-l5", section: "library", title: "سیری در سیره نبوی", subtitle: "سیره پیامبر اکرم (ص)", author: "شهید مرتضی مطهری", tag: "سیره", body: "تحلیلی از روش‌ها و منش پیامبر اکرم (ص) در تبلیغ، تربیت و مدیریت جامعه.", published: true, createdAt: "2026-01-01T00:00:00Z" },
      { id: "ct-l6", section: "library", title: "الغدیر", subtitle: "دانشنامه غدیر", author: "علامه عبدالحسین امینی", tag: "تاریخ", body: "اثری سترگ درباره واقعه غدیر خم و اسناد آن در منابع گوناگون اسلامی.", published: true, createdAt: "2026-01-01T00:00:00Z" },
    ],
  };
}