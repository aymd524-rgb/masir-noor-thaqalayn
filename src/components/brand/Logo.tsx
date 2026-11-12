import { cn } from "@/lib/utils";

/** Eight-point star mark with gold gradient. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id="mn-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--warning)" />
        </linearGradient>
      </defs>
      <rect x="9" y="9" width="30" height="30" rx="4" fill="var(--primary)" />
      <rect x="9" y="9" width="30" height="30" rx="4" fill="var(--primary-deep)" transform="rotate(45 24 24)" />
      <path
        d="M24 13c-1.5 4.5-4.6 7.6-9 9 4.4 1.4 7.5 4.5 9 9 1.5-4.5 4.6-7.6 9-9-4.4-1.4-7.5-4.5-9-9z"
        fill="url(#mn-gold)"
      />
      <circle cx="24" cy="24" r="17" fill="none" stroke="url(#mn-gold)" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-tight">
        <span className="text-base font-extrabold text-primary-deep">مسیر نور ثقلین</span>
        {!compact && <span className="text-[11px] font-medium text-muted-foreground">آموزش معارف قرآن و عترت</span>}
      </span>
    </span>
  );
}