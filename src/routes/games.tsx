import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, CheckCircle2, CircleHelp, RefreshCw, Trophy } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/backend/supabase";
import {
  checkPublishedGameAnswer,
  fetchPublishedGameQuestions,
  type GameAgeGroup,
  type GameQuestion,
} from "@/lib/backend/games";

export const Route = createFileRoute("/games")({ component: GamesPage });

function optionLabel(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function GamesPage() {
  const { user, mode } = useAuth();
  const [ageGroup, setAgeGroup] = useState<GameAgeGroup>("kids");
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "backend") {
      setQuestions([]);
      setError("بازی‌های مشترک پس از اتصال امن به پایگاه داده در دسترس قرار می‌گیرند.");
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setError("اتصال پایگاه داده تنظیم نشده است.");
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setIndex(0);
    setSelected([]);
    setChecked(null);
    fetchPublishedGameQuestions(sb, ageGroup)
      .then((items) => { if (active) setQuestions(items); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "دریافت بازی‌ها ناموفق بود.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mode, ageGroup]);

  const question = questions[index];
  const options = useMemo(
    () => (question?.options ?? []).map(optionLabel).filter(Boolean),
    [question],
  );
  const isWordOrder = question?.game_type === "word_order";
  const answerReady = selected.length > 0 && (!isWordOrder || selected.length === options.length);

  const choose = (optionIndex: number) => {
    if (checked !== null) return;
    setSelected((current) => {
      if (isWordOrder) {
        return current.includes(optionIndex)
          ? current.filter((item) => item !== optionIndex)
          : [...current, optionIndex];
      }
      return [optionIndex];
    });
  };

  const submit = async () => {
    if (!question || !user || mode !== "backend" || !answerReady || submitting || checked !== null) return;
    const sb = getSupabase();
    if (!sb) return;
    setSubmitting(true);
    try {
      const answer = isWordOrder
        ? selected.map((optionIndex) => options[optionIndex])
        : selected[0];
      setChecked(await checkPublishedGameAnswer(sb, question.id, answer));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "بررسی پاسخ ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    setIndex((current) => (current + 1) % questions.length);
    setSelected([]);
    setChecked(null);
    setError(null);
  };

  return (
    <>
      <PageHeader title="بازی‌های قرآنی" subtitle="یادگیری با پرسش، تمرین و سرگرمی سالم" icon={Trophy} />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-primary" />
            <h2 className="font-extrabold">گروه سنی</h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button type="button" variant={ageGroup === "kids" ? "default" : "outline"} onClick={() => setAgeGroup("kids")}>کودکان</Button>
            <Button type="button" variant={ageGroup === "teens" ? "default" : "outline"} onClick={() => setAgeGroup("teens")}>نوجوانان</Button>
          </div>
        </section>

        {mode !== "backend" && (
          <section className="rounded-2xl border bg-card p-5 text-sm leading-7 text-muted-foreground">
            برای جلوگیری از نمایش پاسخ‌های ساختگی، بازی‌ها فقط پس از اتصال پایگاه دادهٔ مشترک نمایش داده می‌شوند.
          </section>
        )}
        {loading && <p role="status" className="rounded-xl border p-5 text-center text-sm text-muted-foreground">در حال دریافت پرسش‌ها…</p>}
        {error && <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">{error}</p>}

        {!loading && mode === "backend" && !error && !question && (
          <section className="rounded-2xl border border-dashed p-8 text-center">
            <CircleHelp className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-3 font-bold">هنوز پرسشی منتشر نشده است</h2>
            <p className="mt-2 text-sm text-muted-foreground">با انتشار پرسش از بخش مدیریت، اینجا نمایش داده می‌شود.</p>
          </section>
        )}

        {question && !loading && (
          <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{question.topic || "دانش قرآنی"}</span>
              <span>پرسش {index + 1} از {questions.length}</span>
              <span>{question.difficulty === "easy" ? "آسان" : question.difficulty === "hard" ? "پیشرفته" : "متوسط"}</span>
            </div>
            <h2 className="text-lg font-extrabold leading-8">{question.prompt}</h2>
            {isWordOrder && <p className="text-sm text-muted-foreground">گزینه‌ها را به ترتیب درست انتخاب کنید؛ برای برداشتن گزینه، دوباره آن را لمس کنید.</p>}
            <div className="grid gap-2">
              {options.map((option, optionIndex) => {
                const active = selected.includes(optionIndex);
                return (
                  <button
                    key={optionIndex}
                    type="button"
                    onClick={() => choose(optionIndex)}
                    disabled={checked !== null}
                    aria-pressed={active}
                    className={`rounded-xl border p-3 text-start text-sm transition-colors disabled:cursor-default ${active ? "border-primary bg-primary/10 text-foreground" : "bg-background hover:bg-accent"}`}
                  >
                    {isWordOrder && active ? `${selected.indexOf(optionIndex) + 1}. ` : ""}
                    {option}
                  </button>
                );
              })}
            </div>
            {checked !== null && (
              <div className={`rounded-xl p-4 text-sm leading-7 ${checked ? "bg-primary/10 text-foreground" : "bg-secondary text-foreground"}`} role="status">
                <p className="font-bold">{checked ? "آفرین! پاسخ درست است." : "این پاسخ درست نبود؛ از توضیح سؤال یاد بگیر."}</p>
                {question.explanation && <p className="mt-1">{question.explanation}</p>}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {checked === null ? (
                <Button onClick={submit} disabled={!answerReady || submitting || !user}>
                  {submitting ? "در حال بررسی…" : "ثبت پاسخ"}
                </Button>
              ) : (
                <Button onClick={next}><RefreshCw className="me-2 h-4 w-4" /> پرسش بعدی</Button>
              )}
              {!user && <Link to="/auth" className="self-center text-sm font-semibold text-primary underline">برای ثبت پاسخ وارد حساب شوید</Link>}
            </div>
          </section>
        )}
        <p className="text-center text-xs text-muted-foreground">نتیجهٔ پاسخ در پایگاه دادهٔ امن بررسی می‌شود؛ پاسخ صحیح به مرورگر ارسال نمی‌شود.</p>
      </main>
    </>
  );
}
