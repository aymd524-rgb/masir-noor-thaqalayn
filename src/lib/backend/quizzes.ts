import type { SupabaseClient } from "@supabase/supabase-js";
import type { Quiz, QuizAttempt, QuizQuestion, User } from "@/lib/domain/types";

type QuizRow = {
  id: string; title: string; description: string; course_id: string | null;
  created_by: string; time_limit_min: number; is_competition: boolean;
  is_published: boolean; created_at: string;
  quiz_questions: Array<{ id: string; prompt: string; options: string[]; position: number }>;
};
type AnswerKeyRow = { question_id: string; answer_index: number };
type AttemptRow = { id: string; quiz_id: string; student_id: string; correct_count: number; total_questions: number; submitted_at: string };

function mapAttempt(row: AttemptRow): QuizAttempt {
  return { id: row.id, quizId: row.quiz_id, userId: row.student_id, score: row.correct_count, total: row.total_questions, at: row.submitted_at };
}

export async function loadBackendQuizWorkspace(sb: SupabaseClient, user: User) {
  const { data: quizRows, error: quizError } = await sb.from("quizzes")
    .select("id,title,description,course_id,created_by,time_limit_min,is_competition,is_published,created_at,quiz_questions(id,prompt,options,position)")
    .order("created_at", { ascending: false });
  if (quizError) throw quizError;
  const rows = (quizRows ?? []) as unknown as QuizRow[];
  const questionIds = rows.flatMap((row) => row.quiz_questions.map((question) => question.id));
  let answerKeys: AnswerKeyRow[] = [];
  if ((user.role === "teacher" || user.role === "admin") && questionIds.length) {
    const { data, error } = await sb.from("quiz_answer_keys").select("question_id,answer_index").in("question_id", questionIds);
    if (error) throw error;
    answerKeys = (data ?? []) as AnswerKeyRow[];
  }
  const keyByQuestion = new Map(answerKeys.map((key) => [key.question_id, key.answer_index]));
  const quizzes: Quiz[] = rows.map((row) => ({
    id: row.id, title: row.title, description: row.description, courseId: row.course_id ?? undefined,
    createdBy: row.created_by, timeLimitMin: row.time_limit_min, open: row.is_published,
    isCompetition: row.is_competition, createdAt: row.created_at,
    questions: row.quiz_questions.sort((a, b) => a.position - b.position).map((question) => ({
      id: question.id, text: question.prompt, options: question.options,
      // Correct answers are never sent to student clients.
      answerIndex: keyByQuestion.get(question.id) ?? -1,
    })),
  }));
  const { data: attemptRows, error: attemptError } = await sb.from("quiz_attempts")
    .select("id,quiz_id,student_id,correct_count,total_questions,submitted_at")
    .order("submitted_at", { ascending: false });
  if (attemptError) throw attemptError;
  return { quizzes, attempts: ((attemptRows ?? []) as AttemptRow[]).map(mapAttempt) };
}

export async function createBackendQuiz(
  sb: SupabaseClient,
  user: User,
  input: { title: string; description: string; courseId?: string; timeLimitMin: number; isCompetition: boolean; questions: QuizQuestion[] },
) {
  if (user.role !== "teacher" && user.role !== "admin") throw new Error("فقط استاد یا مدیر می‌تواند آزمون بسازد.");
  if (!input.title.trim() || !Number.isInteger(input.timeLimitMin) || input.timeLimitMin < 1 || input.timeLimitMin > 240) throw new Error("عنوان یا مدت آزمون معتبر نیست.");
  if (!input.questions.length) throw new Error("حداقل یک پرسش لازم است.");
  for (const question of input.questions) {
    if (!question.text.trim() || question.options.length < 2 || question.options.length > 8 ||
      question.options.some((option) => !option.trim()) || !Number.isInteger(question.answerIndex) ||
      question.answerIndex < 0 || question.answerIndex >= question.options.length) {
      throw new Error("متن پرسش، گزینه‌ها یا پاسخ صحیح کامل و معتبر نیست.");
    }
  }
  const { data: quiz, error: quizError } = await sb.from("quizzes").insert({
    title: input.title.trim(), description: input.description.trim(), course_id: input.courseId ?? null,
    created_by: user.id, time_limit_min: input.timeLimitMin, is_competition: input.isCompetition, is_published: false,
  }).select("id").single();
  if (quizError) throw quizError;
  try {
    const { data: questions, error: questionError } = await sb.from("quiz_questions").insert(input.questions.map((question, index) => ({
      quiz_id: quiz.id, prompt: question.text.trim(), options: question.options.map((option) => option.trim()), position: index + 1,
    }))).select("id");
    if (questionError) throw questionError;
    const keyRows = (questions ?? []).map((question, index) => ({ question_id: question.id, answer_index: input.questions[index].answerIndex }));
    const { error: keyError } = await sb.from("quiz_answer_keys").insert(keyRows);
    if (keyError) throw keyError;
    const { error: publishError } = await sb.from("quizzes").update({ is_published: true }).eq("id", quiz.id);
    if (publishError) throw publishError;
  } catch (error) {
    await sb.from("quizzes").delete().eq("id", quiz.id);
    throw error;
  }
}

export async function setBackendQuizPublished(sb: SupabaseClient, quizId: string, published: boolean) {
  const { error } = await sb.from("quizzes").update({ is_published: published }).eq("id", quizId);
  if (error) throw error;
}

export async function submitBackendQuizAttempt(sb: SupabaseClient, quizId: string, answers: Record<string, number>) {
  const { data, error } = await sb.rpc("submit_quiz_attempt", { p_quiz_id: quizId, p_answers: answers }).single();
  if (error) throw error;
  return data as { attempt_id: string; correct_count: number; total_questions: number; percentage: number };
}
