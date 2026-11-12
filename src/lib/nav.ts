import {
  BookHeart,
  BookOpen,
  GraduationCap,
  HandHeart,
  Library,
  ScrollText,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./domain/types";

export type SectionPath =
  | "/quran"
  | "/ahlul-bayt"
  | "/nahj-al-balagha"
  | "/sahifa"
  | "/library"
  | "/duas"
  | "/courses"
  | "/quizzes";

export interface NavItem {
  to: SectionPath;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
}

export const SECTIONS: NavItem[] = [
  { to: "/quran", label: "آموزش قرآن", short: "قرآن", description: "تلاوت، تجوید و مفاهیم", icon: BookOpen },
  { to: "/ahlul-bayt", label: "اهل‌بیت (ع)", short: "اهل‌بیت", description: "سیره و سخن معصومان", icon: Sparkles },
  { to: "/nahj-al-balagha", label: "نهج‌البلاغه", short: "نهج‌البلاغه", description: "خطبه‌ها، نامه‌ها، حکمت‌ها", icon: ScrollText },
  { to: "/sahifa", label: "صحیفه سجادیه", short: "صحیفه", description: "زبور آل محمد (ص)", icon: BookHeart },
  { to: "/library", label: "کتابخانه دیجیتال", short: "کتابخانه", description: "کتاب‌های مرجع و منتخب", icon: Library },
  { to: "/duas", label: "ادعیه و زیارات", short: "ادعیه", description: "دعاها و زیارت‌نامه‌ها", icon: HandHeart },
  { to: "/courses", label: "دوره‌ها و کلاس‌ها", short: "دوره‌ها", description: "ثبت‌نام در کلاس‌ها", icon: GraduationCap },
  { to: "/quizzes", label: "مسابقات و آزمون‌ها", short: "آزمون‌ها", description: "سنجش و رقابت علمی", icon: Trophy },
];

export const dashboardPath = (role: Role) =>
  role === "admin" ? ("/admin" as const) : role === "teacher" ? ("/teacher" as const) : ("/student" as const);