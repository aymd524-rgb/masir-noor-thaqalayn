import * as React from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { AttendanceStatus, EnrollmentStatus } from "@/lib/domain/types";
import { attendanceLabel, enrollmentLabel, faNum } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <section className="bg-hero pattern-stars overflow-hidden rounded-b-[2rem] text-hero-foreground">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-7 md:pb-12 md:pt-10">
        <div className="flex items-start gap-3 animate-fade-up">
          {Icon && (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground shadow-gold">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-hero-foreground/80 md:text-base">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </section>
  );
}

export function SectionTitle({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-primary-deep">
        <span className="h-5 w-1.5 rounded-full bg-gold-gradient" aria-hidden="true" />
        {title}
      </h2>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "primary" | "gold" | "info" | "warning";
  hint?: string;
}) {
  const toneClass = {
    primary: "bg-accent text-accent-foreground",
    gold: "bg-gold-soft text-gold-foreground",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
  }[tone];
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className={cn("grid h-10 w-10 place-items-center rounded-xl", toneClass)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-2xl font-extrabold text-foreground">
          {typeof value === "number" ? faNum(value) : value}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required && (
          <span className="ms-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-input bg-card pe-9 ps-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  ),
);
NativeSelect.displayName = "NativeSelect";

export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  const variant = status === "approved" ? "success" : status === "pending" ? "warning" : "destructive";
  return <Badge variant={variant}>{enrollmentLabel[status]}</Badge>;
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const variant =
    status === "present" ? "success" : status === "late" ? "warning" : status === "excused" ? "info" : "destructive";
  return <Badge variant={variant}>{attendanceLabel[status]}</Badge>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "پیشرفت"}
      className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div className="h-full rounded-full bg-emerald-gradient transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const parts = name.replace(/^(استاد|خانم|آقای|سید)\s+/, "").split(/\s+/);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-gradient text-sm font-bold text-primary-foreground",
        className,
      )}
    >
      {parts[0]?.[0]}
      {parts[1]?.[0]}
    </span>
  );
}