import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/60 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-bold text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ rows = 3, label = "در حال بارگذاری…" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title = "مشکلی پیش آمد",
  description = "بارگذاری اطلاعات انجام نشد. لطفاً دوباره تلاش کنید.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive-soft px-6 py-8 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-bold text-destructive">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw /> تلاش دوباره
        </Button>
      )}
    </div>
  );
}