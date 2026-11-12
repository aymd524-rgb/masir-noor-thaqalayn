import { Link, useNavigate } from "@tanstack/react-router";
import {
  GraduationCap,
  Home,
  LayoutDashboard,
  Library,
  LogIn,
  LogOut,
  Menu,
  Trophy,
  UserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import { SECTIONS, dashboardPath } from "@/lib/nav";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:right-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        پرش به محتوای اصلی
      </a>

      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              aria-label="باز کردن منو"
              onClick={() => setOpen(true)}
            >
              <Menu className="!size-6" />
            </Button>
            <Link to="/" aria-label="مسیر نور ثقلین — صفحه اصلی">
              <Logo compact className="sm:hidden" />
              <Logo className="hidden sm:flex" />
            </Link>
          </div>

          <nav aria-label="بخش‌های اصلی" className="hidden xl:block">
            <ul className="flex items-center gap-0.5">
              {SECTIONS.map((s) => (
                <li key={s.to}>
                  <Link
                    to={s.to}
                    className="rounded-lg px-2.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    activeProps={{ className: "bg-accent text-accent-foreground" }}
                  >
                    {s.short}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {user ? (
            <Link
              to={dashboardPath(user.role)}
              className="flex items-center gap-2 rounded-full border bg-card py-1 pe-1 ps-3 shadow-sm transition-colors hover:bg-accent"
              aria-label={`پیشخوان ${user.fullName}`}
            >
              <span className="hidden text-sm font-semibold sm:inline">پیشخوان</span>
              <Avatar name={user.fullName} className="h-8 w-8 text-xs" />
            </Link>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">
                <LogIn /> ورود / ثبت‌نام
              </Link>
            </Button>
          )}
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[85%] overflow-y-auto p-0 sm:max-w-sm">
          <SheetHeader className="bg-hero pattern-stars p-5 text-hero-foreground">
            <div className="flex items-center gap-2">
              <LogoMark />
              <SheetTitle className="text-hero-foreground">مسیر نور ثقلین</SheetTitle>
            </div>
            <SheetDescription className="text-hero-foreground/75">آموزش معارف قرآن و عترت</SheetDescription>
            {user && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-hero-foreground/10 p-3">
                <Avatar name={user.fullName} />
                <div className="min-w-0">
                  <p className="truncate font-bold">{user.fullName}</p>
                  <p className="text-xs text-hero-foreground/75">{roleLabel[user.role]}</p>
                </div>
              </div>
            )}
          </SheetHeader>
          <nav aria-label="منوی کامل" className="p-3">
            <ul className="space-y-1">
              <DrawerLink to="/" icon={Home} label="صفحه اصلی" onNavigate={() => setOpen(false)} />
              {user && (
                <DrawerLink
                  to={dashboardPath(user.role)}
                  icon={LayoutDashboard}
                  label="پیشخوان من"
                  onNavigate={() => setOpen(false)}
                />
              )}
            </ul>
            <div className="divider-ornament my-3" />
            <ul className="space-y-1">
              {SECTIONS.map((s) => (
                <DrawerLink
                  key={s.to}
                  to={s.to}
                  icon={s.icon}
                  label={s.label}
                  hint={s.description}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </ul>
            <div className="divider-ornament my-3" />
            <ul className="space-y-1">
              <DrawerLink to="/account" icon={UserRound} label="حساب کاربری" onNavigate={() => setOpen(false)} />
              {user ? (
                <li>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-destructive hover:bg-destructive-soft"
                  >
                    <LogOut className="h-5 w-5" aria-hidden="true" /> خروج از حساب
                  </button>
                </li>
              ) : (
                <DrawerLink to="/auth" icon={LogIn} label="ورود / ثبت‌نام" onNavigate={() => setOpen(false)} />
              )}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      <main id="main" className="flex-1 pb-24 xl:pb-10">
        {children}
      </main>

      <footer className="hidden border-t bg-card/60 py-6 text-center text-sm text-muted-foreground xl:block">
        <p>
          «إِنِّي تَارِكٌ فِيكُمُ الثَّقَلَيْنِ» — مسیر نور ثقلین، سامانه آموزش معارف قرآن و اهل‌بیت علیهم‌السلام
        </p>
      </footer>

      <nav
        aria-label="ناوبری پایین"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 shadow-elegant backdrop-blur-md xl:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
          <BottomLink to="/" icon={Home} label="خانه" exact />
          <BottomLink to="/courses" icon={GraduationCap} label="دوره‌ها" />
          <BottomLink to="/library" icon={Library} label="کتابخانه" />
          <BottomLink to="/quizzes" icon={Trophy} label="مسابقات" />
          {user ? (
            <BottomLink to={dashboardPath(user.role)} icon={LayoutDashboard} label="پیشخوان" />
          ) : (
            <BottomLink to="/auth" icon={LogIn} label="ورود" />
          )}
        </ul>
      </nav>
    </div>
  );
}

type AppPath = "/" | "/account" | "/auth" | "/student" | "/teacher" | "/admin" | (typeof SECTIONS)[number]["to"];

function DrawerLink({
  to,
  icon: Icon,
  label,
  hint,
  onNavigate,
}: {
  to: AppPath;
  icon: typeof Home;
  label: string;
  hint?: string;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        to={to}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
        activeProps={{ className: "bg-accent text-accent-foreground" }}
        activeOptions={{ exact: to === "/" }}
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="flex flex-col">
          {label}
          {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
        </span>
      </Link>
    </li>
  );
}

function BottomLink({
  to,
  icon: Icon,
  label,
  exact,
}: {
  to: AppPath;
  icon: typeof Home;
  label: string;
  exact?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        activeOptions={{ exact: !!exact }}
        className="group flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted-foreground"
        activeProps={{ className: "text-primary", "aria-current": "page" }}
      >
        <span className="grid h-8 w-12 place-items-center rounded-full transition-colors group-data-[status=active]:bg-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {label}
      </Link>
    </li>
  );
}