import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CURRENT_APP_VERSION = "1.0.0";
const DISMISSED_VERSION_KEY = "masir-noor-dismissed-update";

type ReleaseInfo = {
  version: string;
  minimumVersion?: string;
  releaseNotes?: string[];
  androidApkUrl?: string | null;
};

function compareVersions(left: string, right: string) {
  const a = left.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const b = right.split(".").map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function UpdateNotice() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdate = useCallback(async () => {
    try {
      const response = await fetch(`/app-version.json?check=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      const data = (await response.json()) as ReleaseInfo;
      if (!data.version || compareVersions(data.version, CURRENT_APP_VERSION) <= 0) {
        setRelease(null);
        return;
      }
      setRelease(data);
      try {
        setDismissed(window.localStorage.getItem(DISMISSED_VERSION_KEY) === data.version);
      } catch {
        setDismissed(false);
      }
    } catch {
      // Update checks are best-effort; the app remains usable while offline.
    }
  }, []);

  useEffect(() => {
    void checkForUpdate();
    const interval = window.setInterval(() => void checkForUpdate(), 30 * 60 * 1000);
    const onFocus = () => void checkForUpdate();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [checkForUpdate]);

  const mandatory =
    Boolean(release?.minimumVersion) &&
    compareVersions(release.minimumVersion ?? "0", CURRENT_APP_VERSION) > 0;

  if (!release || (dismissed && !mandatory)) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_VERSION_KEY, release.version);
    } catch {
      // Dismissal is optional when browser storage is unavailable.
    }
    setDismissed(true);
  };

  const refreshWebApp = () => {
    window.location.reload();
  };

  return (
    <section
      dir="rtl"
      role="status"
      aria-live="polite"
      className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-6xl rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Download className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold text-foreground">به‌روزرسانی جدید آماده است</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              نسخه {release.version}
            </span>
            {mandatory && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                ضروری
              </span>
            )}
          </div>
          {release.releaseNotes?.length ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {release.releaseNotes.slice(0, 3).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              برای دریافت امکانات تازه و بهبودها، برنامه را به‌روز کنید.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {release.androidApkUrl ? (
              <Button asChild size="sm">
                <a href={release.androidApkUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="ms-1 h-4 w-4" />
                  دریافت نسخه اندروید
                </a>
              </Button>
            ) : (
              <Button size="sm" onClick={refreshWebApp}>
                <RefreshCw className="ms-1 h-4 w-4" />
                بارگذاری نسخه جدید
              </Button>
            )}
            {!mandatory && (
              <Button size="sm" variant="ghost" onClick={dismiss}>
                بعداً
              </Button>
            )}
          </div>
        </div>
        {!mandatory && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="بستن اعلان به‌روزرسانی"
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
