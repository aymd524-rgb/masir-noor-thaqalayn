import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, CheckCircle2, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { commit, useDb } from "@/lib/store";
import { faNum } from "@/lib/format";
import { scoreQuizAnswers } from "@/lib/quizzes/scoring";
import { buildCompetitionLeaderboard } from "@/lib/quizzes/leaderboard";

export const Route = createFileRoute("/quizzes")({ component: QuizzesPage });

function QuizzesPage() {
  const db = useDb();
  const { user, mode } = useAuth();
  const quizzes = db.quizzes.filter((quiz) => quiz.open);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ quizId: string; correct: number; total: number; score: number } | null>(null);
  const activeQuiz = quizzes.find((quiz) => quiz.id === activeId);
  const attempts = user ? db.attempts.filter((attempt) => attempt.userId === user.id) : [];
  const competitionBoards = quizzes.filter((quiz) => quiz.isCompetition).map((quiz) => ({ quiz, entries: buildCompetitionLeaderboard(quiz, db.attempts, db.users) }));

  const startQuiz = (quizId: string) => {
    setAnswers({});
    setResult(null);
    setActiveId(quizId);
  };

  const submitQuiz = () => {
    if (!activeQuiz || !user || user.role !== "student" || mode !== "demo") return;
    const scored = scoreQuizAnswers(activeQuiz.questions, answers);
    const attemptId = `attempt-${user.id}-${activeQuiz.id}-${Date.now()}`;
    commit((current) => ({
      ...current,
      attempts: [...current.attempts, {
        id: attemptId, quizId: activeQuiz.id, userId: user.id,
        score: scored.correct, total: scored.total, at: new Date().toISOString(),
      }],
    }));
    setResult({ quizId: activeQuiz.id, ...scored });
  };

  return <>
    <PageHeader title="مسابقات و آزمون‌ها" subtitle="آزمون‌های فعال و سنجش آموخته‌ها" icon={Trophy} />
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      {mode === "backend" && <p className="rounded-xl border p-4 text-sm text-muted-foreground">اجرای آزمون و ثبت پاسخ‌ها در نسخه متصل به پایگاه داده هنوز فعال نشده است؛ در این حالت نتیجه‌ای به‌صورت آزمایشی ذخیره نمی‌شود.</p>}
      {!user && <p className="rounded-xl border p-4 text-sm">برای شرکت در آزمون ابتدا <Link className="font-bold text-primary underline" to="/auth">وارد حساب دانش‌پژوه</Link> شوید.</p>}
      {user && user.role !== "student" && <p className="rounded-xl border p-4 text-sm">شرکت در آزمون از حساب دانش‌پژوه امکان‌پذیر است.</p>}
      {activeQuiz && user?.role === "student" && mode === "demo" ? (
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
              <Button disabled={Object.keys(answers).length !== activeQuiz.questions.length} onClick={submitQuiz}>ثبت پاسخ‌ها و مشاهده نتیجه</Button>
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
            <Button className="mt-4 w-full" variant="outline" disabled={!user || user.role !== "student" || mode !== "demo"} onClick={() => startQuiz(quiz.id)}><ClipboardList className="me-2 h-4 w-4"/>شروع آزمون</Button>
          </li>;
        })}</ul> : <EmptyState icon={Trophy} title="آزمون فعالی وجود ندارد" description="پس از انتشار آزمون توسط مدرس، اینجا نمایش داده می‌شود." />}
      </>}
      {mode === "demo" && !activeQuiz && competitionBoards.some((board) => board.entries.length > 0) && <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">جدول رتبه‌بندی مسابقات</h2><div className="mt-4 space-y-5">{competitionBoards.filter((board) => board.entries.length > 0).map(({ quiz, entries }) => <div key={quiz.id}><h3 className="text-sm font-bold">{quiz.title}</h3><ol className="mt-2 divide-y">{entries.map((entry, index) => <li key={entry.userId} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{faNum(index + 1)}. {entry.fullName}<span className="ms-2 text-xs text-muted-foreground">({faNum(entry.attempts)} شرکت)</span></span><b>{faNum(entry.score)}٪</b></li>)}</ol></div>)}</div></section>}
      {user?.role === "student" && mode === "demo" && attempts.length > 0 && !activeQuiz && <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">سوابق آزمون من</h2><ul className="mt-3 divide-y">{attempts.slice().reverse().map((attempt) => <li key={attempt.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{quizzes.find((quiz) => quiz.id === attempt.quizId)?.title ?? "آزمون"}</span><b>{faNum(attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0)}٪</b></li>)}</ul></section>}
      <p className="text-xs text-muted-foreground">توجه: در حالت نمایشی، نتایج فقط روی همین دستگاه ذخیره می‌شوند و به حساب‌های دیگر منتقل نمی‌شوند.</p>
    </div>
  </>;
}
