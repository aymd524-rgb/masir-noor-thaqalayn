import type {
  AttendanceStatus,
  ContentSection,
  CourseCategory,
  CourseLevel,
  EnrollmentStatus,
  MaterialType,
  Role,
} from "./domain/types";

const TZ = "Asia/Tehran";

export const faNum = (n: number | string, opts?: Intl.NumberFormatOptions) =>
  typeof n === "number" ? n.toLocaleString("fa-IR", opts) : n.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

export const faDate = (iso: string) =>
  new Intl.DateTimeFormat("fa-IR", { timeZone: TZ, year: "numeric", month: "long", day: "numeric" }).format(
    new Date(iso),
  );

export const faShortDate = (iso: string) =>
  new Intl.DateTimeFormat("fa-IR", { timeZone: TZ, month: "short", day: "numeric" }).format(new Date(iso));

export const faDateTime = (iso: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    timeZone: TZ,
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const initials = (name: string) =>
  name
    .replace(/^(استاد|خانم|آقای|سید)\s+/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("‌");

export const roleLabel: Record<Role, string> = {
  student: "دانش‌پژوه",
  teacher: "استاد / مربی",
  admin: "مدیر سامانه",
};

export const categoryLabel: Record<CourseCategory, string> = {
  quran: "قرآن کریم",
  ahlulbayt: "اهل‌بیت (ع)",
  nahj: "نهج‌البلاغه",
  sahifa: "صحیفه سجادیه",
  akhlagh: "اخلاق و معارف",
};

export const levelLabel: Record<CourseLevel, string> = {
  beginner: "مقدماتی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

export const enrollmentLabel: Record<EnrollmentStatus, string> = {
  pending: "در انتظار بررسی",
  approved: "تأیید شده",
  rejected: "رد شده",
};

export const attendanceLabel: Record<AttendanceStatus, string> = {
  present: "حاضر",
  absent: "غایب",
  late: "تأخیر",
  excused: "غیبت موجه",
};

export const materialLabel: Record<MaterialType, string> = {
  pdf: "PDF",
  audio: "صوت",
  video: "ویدئو",
  link: "پیوند",
  doc: "سند",
};

export const sectionLabel: Record<ContentSection, string> = {
  quran: "آموزش قرآن",
  ahlulbayt: "اهل‌بیت (ع)",
  nahj: "نهج‌البلاغه",
  sahifa: "صحیفه سجادیه",
  library: "کتابخانه دیجیتال",
  duas: "ادعیه و زیارات",
};