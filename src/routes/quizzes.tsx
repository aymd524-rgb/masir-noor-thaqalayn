import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { EmptyState } from "@/components/common/states";
import { useDb } from "@/lib/store";
import { faNum } from "@/lib/format";

export const Route = createFileRoute("/quizzes")({ component: QuizzesPage });
function QuizzesPage() {
  const db = useDb();
  const quizzes = db.quizzes.filter((quiz) => quiz.open);
  return <><PageHeader title="مسابقات و آزمون‌ها" subtitle="آزمون‌های فعال و سنجش آموخته‌ها" icon={Trophy} /><div className="mx-auto max-w-5xl px-4 py-6">
    {quizzes.length ? <ul className="grid gap-3 sm:grid-cols-2">{quizzes.map((quiz) => <li key={quiz.id} className="rounded-2xl border bg-card p-5 shadow-soft"><h2 className="font-bold">{quiz.title}</h2><p className="mt-2 text-sm text-muted-foreground">{quiz.description}</p><p className="mt-3 text-xs text-muted-foreground">{faNum(quiz.questions.length)} پرسش · {faNum(quiz.timeLimitMin)} دقیقه</p><span className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{quiz.isCompetition ? "مسابقه" : "آزمون"}</span></li>)}</ul> : <EmptyState icon={Trophy} title="آزمون فعالی وجود ندارد" description="پس از انتشار آزمون توسط مدرس، اینجا نمایش داده می‌شود." />}
  </div></>;
}