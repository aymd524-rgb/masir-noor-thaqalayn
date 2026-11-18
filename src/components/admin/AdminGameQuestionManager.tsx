import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";
import {
  createAdminGameQuestion,
  fetchAdminGameQuestions,
  setAdminGameQuestionPublished,
  type AdminGameQuestion,
  type GameAgeGroup,
  type GameType,
} from "@/lib/backend/games";

const gameTypeLabels: Record<GameType, string> = {
  multiple_choice: "چهارگزینه‌ای",
  true_false: "درست یا نادرست",
  word_order: "مرتب‌سازی واژه‌ها",
  concept_guess: "حدس مفهوم",
};

export function AdminGameQuestionManager() {
  const [questions, setQuestions] = useState<AdminGameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>("multiple_choice");
  const [ageGroup, setAgeGroup] = useState<GameAgeGroup>("kids");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [prompt, setPrompt] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [answerInput, setAnswerInput] = useState("1");
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");

  const options = useMemo(
    () => optionsText.split("\n").map((item) => item.trim()).filter(Boolean),
    [optionsText],
  );

  const loadQuestions = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("اتصال پایگاه داده تنظیم نشده است.");
    const rows = await fetchAdminGameQuestions(sb);
    setQuestions(rows);
  }, []);

  useEffect(() => {
    let active = true;
    void loadQuestions()
      .catch((error: unknown) => {
        if (active) toast.error(error instanceof Error ? error.message : "دریافت پرسش‌ها ناموفق بود.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadQuestions]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (options.length < 2 || options.length > 8) {
      toast.error("بین ۲ تا ۸ گزینه وارد کنید؛ هر گزینه در یک خط.");
      return;
    }
    let answerPayload: number | string[];
    if (gameType === "word_order") {
      const indexes = answerInput.split(",").map((part) => Number(part.trim()) - 1);
      if (
        indexes.length !== options.length ||
        indexes.some((index) => !Number.isInteger(index) || index < 0 || index >= options.length) ||
        new Set(indexes).size !== options.length
      ) {
        toast.error("ترتیب صحیح را با شماره گزینه‌ها وارد کنید؛ مانند 2,1,3.");
        return;
      }
      answerPayload = indexes.map((index) => options[index]);
    } else {
      const index = Number(answerInput) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= options.length) {
        toast.error("شماره گزینه صحیح معتبر نیست.");
        return;
      }
      answerPayload = index;
    }

    const sb = getSupabase();
    if (!sb) {
      toast.error("اتصال پایگاه داده تنظیم نشده است.");
      return;
    }
    setSaving(true);
    try {
      await createAdminGameQuestion(sb, {
        gameType,
        prompt,
        options,
        explanation,
        topic,
        difficulty,
        ageGroup,
        answerPayload,
      });
      setPrompt("");
      setOptionsText("");
      setAnswerInput("1");
      setTopic("");
      setExplanation("");
      await loadQuestions();
      toast.success("پرسش به‌صورت پیش‌نویس ذخیره شد؛ پس از بازبینی می‌توانید آن را منتشر کنید.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره پرسش ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (question: AdminGameQuestion) => {
    const sb = getSupabase();
    if (!sb || busyId) return;
    setBusyId(question.id);
    try {
      await setAdminGameQuestionPublished(sb, question.id, !question.is_published);
      await loadQuestions();
      toast.success(question.is_published ? "پرسش از انتشار خارج شد." : "پرسش منتشر شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تغییر وضعیت پرسش ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-extrabold">مدیریت بازی‌های قرآنی</h2>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          پرسش‌ها ابتدا به‌صورت پیش‌نویس ذخیره می‌شوند. پاسخ صحیح در جدول خصوصی باقی می‌ماند و به مرورگر دانش‌پژوه ارسال نمی‌شود.
        </p>
      </div>

      <form onSubmit={(event) => void submit(event)} className="space-y-3 rounded-xl bg-muted/30 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            نوع بازی
            <select value={gameType} onChange={(event) => setGameType(event.target.value as GameType)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal">
              {Object.entries(gameTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">
            گروه سنی
            <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value as GameAgeGroup)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal">
              <option value="kids">کودکان</option>
              <option value="teens">نوجوانان</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            دشواری
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as "easy" | "medium" | "hard")} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal">
              <option value="easy">آسان</option>
              <option value="medium">متوسط</option>
              <option value="hard">پیشرفته</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            موضوع
            <input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={120} required placeholder="مثلاً شناخت سوره‌ها" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          متن پرسش
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={1200} required rows={2} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          گزینه‌ها (هر گزینه در یک خط)
          <textarea value={optionsText} onChange={(event) => setOptionsText(event.target.value)} required rows={4} placeholder={"سوره حمد\nسوره ناس\nسوره اخلاص"} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold">
          {gameType === "word_order" ? "ترتیب صحیح شماره گزینه‌ها" : "شماره گزینه صحیح"}
          <input value={answerInput} onChange={(event) => setAnswerInput(event.target.value)} required placeholder={gameType === "word_order" ? "مثلاً 2,1,3" : "مثلاً 1"} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            شماره‌گذاری از ۱ شروع می‌شود. در مرتب‌سازی، شماره‌ها را با ویرگول جدا کنید.
          </span>
        </label>
        <label className="block text-sm font-semibold">
          توضیح پاسخ
          <textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} maxLength={2000} rows={2} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{options.length} گزینه آماده</span>
          <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {saving ? "در حال ذخیره…" : "ذخیره پیش‌نویس"}
          </button>
        </div>
      </form>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold">پرسش‌های ثبت‌شده</h3>
          <span className="text-xs text-muted-foreground">۱۰۰ پرسش اخیر</span>
        </div>
        {loading ? <p className="mt-3 text-sm text-muted-foreground">در حال دریافت…</p> : questions.length ? (
          <ul className="mt-3 divide-y">
            {questions.map((question) => (
              <li key={question.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{question.prompt}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {gameTypeLabels[question.game_type]} · {question.age_group === "kids" ? "کودکان" : "نوجوانان"} · {question.topic || "بدون موضوع"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {question.is_published ? "منتشرشده" : "پیش‌نویس"} · {new Date(question.created_at).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <button type="button" onClick={() => void togglePublished(question)} disabled={busyId !== null} className="shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-60">
                  {busyId === question.id ? "در حال ذخیره…" : question.is_published ? "خارج‌کردن از انتشار" : "انتشار پرسش"}
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-muted-foreground">هنوز پرسشی ثبت نشده است.</p>}
      </div>
    </section>
  );
}
