import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, CheckCircle2, ClipboardList, Plus, Eye, EyeOff, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { createQuiz, setQuizOpen } from "@/lib/domain/actions";
import type { Quiz, QuizAttempt, QuizQuestion } from "@/lib/domain/types";
import { getSupabase } from "@/lib/backend/supabase";
import { createBackendQuiz, loadBackendQuizWorkspace, setBackendQuizPublished, submitBackendQuizAttempt } from "@/lib/backend/quizzes";
import { commit, useDb } from "@/lib/store";
import { faNum } from "@/lib/format";
import { scoreQuizAnswers } from "@/lib/quizzes/scoring";
import { buildCompetitionLeaderboard } from "@/lib/quizzes/leaderboard";

export const Route = createFileRoute("/quizzes")({ component: QuizzesPage });

function QuizzesPage() {
  const db = useDb();
  const { user, mode } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ quizId: string; correct: number; total: number; score: number } | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftTime, setDraftTime] = useState("10");
  const [draftCompetition, setDraftCompetition] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState<QuizQuestion[]>([{ id: "draft-1", text: "", options: ["", "", "", ""], answerIndex: 0 }]);
  const [backendQuizzes, setBackendQuizzes] = useState<Quiz[]>([]);
  const [backendAttempts, setBackendAttempts] = useState<QuizAttempt[]>([]);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendSubmitting, setBackendSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "backend" || !user) return;
    let alive = true;
    const sb = getSupabase();
    if (!sb) return;
    setBackendLoading(true);
    loadBackendQuizWorkspace(sb, user)
      .then((workspace) => {
        if (!alive) return;
        setBackendQuizzes(workspace.quizzes);
        setBackendAttempts(workspace.attempts);
      })
      .catch((error) => {
        if (alive) toast.error(error instanceof Error ? error.message : "بارگذاری آزمون‌ها انجام نشد.");
      })
      .finally(() => { if (alive) setBackendLoading(false); });
    return () => { alive = false; };
  }, [mode, user?.id, user?.role]);

  const sourceQuizzes = mode === "backend" ? backendQuizzes : db.quizzes;
  const quizzes = sourceQuizzes.filter((quiz) => quiz.open);
  const activeQuiz = quizzes.find((quiz) => quiz.id === activeId);
  const allAttempts = mode === "backend" ? backendAttempts : db.attempts;
  const attempts = user ? allAttempts.filter((attempt) => attempt.userId === user.id) : [];
  const competitionBoards = mode === "demo" ? quizzes.filter((quiz) => quiz.isCompetition).map((quiz) => ({ quiz, entries: buildCompetitionLeaderboard(quiz, db.attempts, db.users) })) : [];
  const managedQuizzes = user && (user.role === "teacher" || user.role === "admin") ? sourceQuizzes.filter((quiz) => user.role === "admin" || quiz.createdBy === user.id) : [];

  const startQuiz = (quizId: string) => {
    setAnswers({});
    setResult(null);
    setActiveId(quizId);
  };

  const submitQuiz = async () => {
    if (!activeQuiz || !user || user.role !== "student" || backendSubmitting) return;
    if (mode === "demo") {
      const scored = scoreQuizAnswers(activeQuiz.questions, answers);
      const attemptId = `attempt-${user.id}-${activeQuiz.id}-${Date.now()}`;
      commit((current) => ({ ...current, attempts: [...current.attempts, {
        id: attemptId, quizId: activeQuiz.id, userId: user.id,
        score: scored.correct, total: scored.total, at: new Date().toISOString(),
      }] }));
      setResult({ quizId: activeQuiz.id, ...scored });
      return;
    }
    const sb = getSupabase();
    if (!sb) return;
    setBackendSubmitting(true);
    try {
      const saved = await submitBackendQuizAttempt(sb, activeQuiz.id, answers);
      setResult({ quizId: activeQuiz.id, correct: saved.correct_count, total: saved.total_questions, score: saved.percentage });
      const workspace = await loadBackendQuizWorkspace(sb, user);
      setBackendAttempts(workspace.attempts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت پاسخ‌ها انجام نشد.");
    } finally { setBackendSubmitting(false); }
  };

  const addDraftQuestion = () => setDraftQuestions((current) => [...current, { id: `draft-${Date.now()}`, text: "", options: ["", "", "", ""], answerIndex: 0 }]);
  const updateDraftQuestion = (id: string, patch: Partial<QuizQuestion>) => setDraftQuestions((current) => current.map((question) => question.id === id ? { ...question, ...patch } : question));
  const updateDraftOption = (id: string, index: number, value: string) => setDraftQuestions((current) => current.map((question) => question.id === id ? { ...question, options: question.options.map((option, optionIndex) => optionIndex === index ? value : option) } : question));
  const saveNewQuiz = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) return;
    try {
      if (mode === "demo") {
        commit((current) => createQuiz(current, user, { title: draftTitle, description: draftDescription, timeLimitMin: Number(draftTime), open: true, isCompetition: draftCompetition, questions: draftQuestions }));
      } else {
        const sb = getSupabase();
        if (!sb) throw new Error("اتصال پایگاه داده در دسترس نیست.");
        await createBackendQuiz(sb, user, { title: draftTitle, description: draftDescription, timeLimitMin: Number(draftTime), isCompetition: draftCompetition, questions: draftQuestions });
        const workspace = await loadBackendQuizWorkspace(sb, user);
        setBackendQuizzes(workspace.quizzes);
        setBackendAttempts(workspace.attempts);
      }
      setDraftTitle(""); setDraftDescription(""); setDraftTime("10"); setDraftCompetition(false);
      setDraftQuestions([{ id: `draft-${Date.now()}`, text: "", options: ["", "", "", ""], answerIndex: 0 }]);
      toast.success("آزمون ساخته و منتشر شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "ساخت آزمون انجام نشد."); }
  };
  const toggleQuiz = async (quizId: string, open: boolean) => {
    if (!user) return;
    try {
      if (mode === "demo") commit((current) => setQuizOpen(current, user, quizId, open));
      else {
        const sb = getSupabase();
        if (!sb) throw new Error("اتصال پایگاه داده در دسترس نیست.");
        await setBackendQuizPublished(sb, quizId, open);
        const workspace = await loadBackendQuizWorkspace(sb, user);
        setBackendQuizzes(workspace.quizzes);
      }
      toast.success(open ? "آزمون منتشر شد." : "آزمون غیرفعال شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "تغییر وضعیت آزمون انجام نشد."); }
  };

  return <>
    <PageHeader title="مسابقات و آزمون‌ها" subtitle="آزمون‌های فعال و سنجش آموخته‌ها" icon={Trophy} />
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      {mode === "backend" && <p className="rounded-xl border p-4 text-sm text-muted-foreground">{backendLoading ? "در حال دریافت آزمون‌ها از پایگاه داده..." : "آزمون‌ها و نتایج این بخش از پایگاه داده دریافت و در همان‌جا ثبت می‌شوند."}</p>}
      {(user?.role === "teacher" || user?.role === "admin") && !activeQuiz && <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div><h2 className="font-extrabold">مدیریت آزمون‌ها</h2><p className="mt-1 text-sm text-muted-foreground">آزمون جدید بسازید، سؤال و گزینه‌ها را وارد کنید و وضعیت انتشار را مدیریت کنید.</p></div>
        <form onSubmit={saveNewQuiz} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">عنوان آزمون<input required value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal" placeholder="مثلاً آزمون روان‌خوانی"/></label>
            <label className="text-sm font-semibold">مدت آزمون (دقیقه)<input required type="number" min="1" max="240" value={draftTime} onChange={(event) => setDraftTime(event.target.value)} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/></label>
          </div>
          <label className="block text-sm font-semibold">توضیحات<textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} rows={2} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal" placeholder="هدف و محدوده آزمون"/></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draftCompetition} onChange={(event) => setDraftCompetition(event.target.checked)}/> این آزمون به‌صورت مسابقه و همراه رتبه‌بندی باشد</label>
          <div className="space-y-3">
            {draftQuestions.map((question, index) => <fieldset key={question.id} className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-2"><legend className="text-sm font-bold">پرسش {faNum(index + 1)}</legend>{draftQuestions.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => setDraftQuestions((current) => current.filter((item) => item.id !== question.id))}><Trash2 className="me-1 h-4 w-4"/>حذف پرسش</Button>}</div>
              <input required value={question.text} onChange={(event) => updateDraftQuestion(question.id, { text: event.target.value })} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm" placeholder="متن پرسش را وارد کنید"/>
              <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <label key={optionIndex} className="text-xs font-semibold">گزینه {faNum(optionIndex + 1)}<input required value={option} onChange={(event) => updateDraftOption(question.id, optionIndex, event.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm font-normal" placeholder={`متن گزینه ${faNum(optionIndex + 1)}`}/></label>)}</div>
              <label className="block text-sm font-semibold">پاسخ صحیح<select value={question.answerIndex} onChange={(event) => updateDraftQuestion(question.id, { answerIndex: Number(event.target.value) })} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal">{question.options.map((_, optionIndex) => <option key={optionIndex} value={optionIndex}>گزینه {faNum(optionIndex + 1)}</option>)}</select></label>
            </fieldset>)}
            <Button type="button" variant="outline" onClick={addDraftQuestion}><Plus className="me-2 h-4 w-4"/>افزودن پرسش</Button>
          </div>
          <Button type="submit" disabled={!draftTitle.trim() || !draftQuestions.length}>ساخت و انتشار آزمون</Button>
        </form>
        <div className="border-t pt-4"><h3 className="font-bold">آزمون‌های ساخته‌شده</h3>
          {managedQuizzes.length ? <ul className="mt-2 divide-y">{managedQuizzes.map((quiz) => <li key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{quiz.title}</p><p className="text-xs text-muted-foreground">{faNum(quiz.questions.length)} پرسش · {quiz.open ? "منتشرشده" : "غیرفعال"}</p></div><Button type="button" size="sm" variant="outline" onClick={() => toggleQuiz(quiz.id, !quiz.open)}>{quiz.open ? <><EyeOff className="me-1 h-4 w-4"/>غیرفعال‌کردن</> : <><Eye className="me-1 h-4 w-4"/>انتشار</>}</Button></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">هنوز آزمونی توسط این حساب ساخته نشده است.</p>}
        </div>
      </section>}
      {!user && <p className="rounded-xl border p-4 text-sm">برای شرکت در آزمون ابتدا <Link className="font-bold text-primary underline" to="/auth">وارد حساب دانش‌پژوه</Link> شوید.</p>}
      {user && user.role !== "student" && <p className="rounded-xl border p-4 text-sm">شرکت در آزمون از حساب دانش‌پژوه امکان‌پذیر است.</p>}
      {activeQuiz && user?.role === "student" ? (
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-extrabold">{activeQuiz.title}</h2><p className="mt-1 text-sm text-muted-foreground">{activeQuiz.description}</p></div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{faNum(activeQuiz.questions.length)} پرسش</span>
          </div>
          {result?.quizId === activeQuiz.id ? (
            <div className="mt-6 rounded-xl bg-secondary/60 p-5 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-primary"/>
              <h3 className="mt-2 text-xl font-extrabold">آزمون به پایان رسید</h3>
              <p className="mt-2 text-3xl font-black text-primary">{faNum(result.total ? Math.round((result.correct / result.total) * 100) : 0)}٪</p>
              <p className="mt-1 text-sm">پاسخ درست: {faNum(result.correct)} از {faNum(result.total)}</p>
              <Button className="mt-4" onClick={() => setActiveId(null)}>بازگشت به فهرست آزمون‌ها</Button>
            </div>
          ) : <>
            <div className="mt-5 space-y-5">
              {activeQuiz.questions.map((question, index) => (
                <fieldset key={question.id} className="rounded-xl border p-4">
                  <legend className="px-2 text-sm font-bold">{faNum(index + 1)}. {question.text}</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => <label key={optionIndex} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${answers[question.id] === optionIndex ? "border-primary bg-primary/5" : ""}`}>
                      <input type="radio" name={question.id} value={optionIndex} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} />
                      <span>{option}</span>
                    </label>)}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{faNum(Object.keys(answers).length)} پاسخ از {faNum(activeQuiz.questions.length)} پرسش</p>
              <Button disabled={Object.keys(answers).length !== activeQuiz.questions.length || backendSubmitting} onClick={submitQuiz}>{backendSubmitting ? "در حال ثبت..." : "ثبت پاسخ‌ها و مشاهده نتیجه"}</Button>
            </div>
          </>}
        </section>
      ) : <>
        {quizzes.length ? <ul className="grid gap-3 sm:grid-cols-2">{quizzes.map((quiz) => {
          const previous = attempts.filter((attempt) => attempt.quizId === quiz.id);
          return <li key={quiz.id} className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="font-bold">{quiz.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{quiz.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">{faNum(quiz.questions.length)} پرسش · {faNum(quiz.timeLimitMin)} دقیقه</p>
            <span className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{quiz.isCompetition ? "مسابقه" : "آزمون"}</span>
            {previous.length > 0 && <p className="mt-3 text-xs text-muted-foreground">آخرین نتیجه: {faNum(previous[previous.length - 1].total ? Math.round((previous[previous.length - 1].score / previous[previous.length - 1].total) * 100) : 0)}٪</p>}
            <Button className="mt-4 w-full" variant="outline" disabled={!user || user.role !== "student" || backendLoading} onClick={() => startQuiz(quiz.id)}><ClipboardList className="me-2 h-4 w-4"/>شروع آزمون</Button>
          </li>;
        })}</ul> : <EmptyState icon={Trophy} title="آزمون فعالی وجود ندارد" description="پس از انتشار آزمون توسط مدرس، اینجا نمایش داده می‌شود." />}
      </>}
      {mode === "demo" && !activeQuiz && competitionBoards.some((board) => board.entries.length > 0) && <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">جدول رتبه‌بندی مسابقات</h2><div className="mt-4 space-y-5">{competitionBoards.filter((board) => board.entries.length > 0).map(({ quiz, entries }) => <div key={quiz.id}><h3 className="text-sm font-bold">{quiz.title}</h3><ol className="mt-2 divide-y">{entries.map((entry, index) => <li key={entry.userId} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{faNum(index + 1)}. {entry.fullName}<span className="ms-2 text-xs text-muted-foreground">({faNum(entry.attempts)} شرکت)</span></span><b>{faNum(entry.score)}٪</b></li>)}</ol></div>)}</div></section>}
      {user?.role === "student" && attempts.length > 0 && !activeQuiz && <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">سوابق آزمون من</h2><ul className="mt-3 divide-y">{attempts.slice().reverse().map((attempt) => <li key={attempt.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{quizzes.find((quiz) => quiz.id === attempt.quizId)?.title ?? "آزمون"}</span><b>{faNum(attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0)}٪</b></li>)}</ul></section>}
      <p className="text-xs text-muted-foreground">توجه: در حالت نمایشی، نتایج فقط روی همین دستگاه ذخیره می‌شوند و به حساب‌های دیگر منتقل نمی‌شوند.</p>
    </div>
  </>;
}
