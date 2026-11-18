import type { SupabaseClient } from "@supabase/supabase-js";
import type { Quiz, QuizAttempt, QuizQuestion, User } from "@/lib/domain/types";

type QuizRow = {
  id: string; title: string; description: string; course_id: string | null;
  created_by: string; time_limit_min: number; is_competition: boolean;
  is_published: boolean; created_at: string;
};
type QuizQuestionRow = {
  id: string; quiz_id: string; prompt: string; options: string[]; position: number;
};
type AnswerKeyRow = { question_id: string; answer_index: number };
type AttemptRow = { id: string; quiz_id: string; student_id: string; correct_count: number; total_questions: number; submitted_at: string };

function mapAttempt(row: AttemptRow): QuizAttempt {
  return { id: row.id, quizId: row.quiz_id, userId: row.student_id, score: row.correct_count, total: row.total_questions, at: row.submitted_at };
}

export async function loadBackendQuizWorkspace(sb: SupabaseClient, user: User) {
  const pageSize = 500;
  const rows: QuizRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb.from("quizzes")
      .select("id,title,description,course_id,created_by,time_limit_min,is_competition,is_published,created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as QuizRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  // Fetch questions independently so a large quiz cannot be silently truncated
  // by PostgREST's row limit on embedded relationships.
  const questionsByQuiz = new Map<string, QuizQuestionRow[]>();
  for (let offset = 0; offset < rows.length; offset += 200) {
    const quizIds = rows.slice(offset, offset + 200).map((row) => row.id);
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await sb.from("quiz_questions")
        .select("id,quiz_id,prompt,options,position")
        .in("quiz_id", quizIds)
        .order("quiz_id", { ascending: true })
        .order("position", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const page = (data ?? []) as QuizQuestionRow[];
      for (const question of page) {
        const list = questionsByQuiz.get(question.quiz_id) ?? [];
        list.push(question);
        questionsByQuiz.set(question.quiz_id, list);
      }
      if (page.length < pageSize) break;
    }
  }
  const questionIds = [...questionsByQuiz.values()].flatMap((questions) => questions.map((question) => question.id));
  let answerKeys: AnswerKeyRow[] = [];
  if ((user.role === "teacher" || user.role === "admin") && questionIds.length) {
    // Keep each IN filter small enough for PostgREST URL and query limits.
    for (let offset = 0; offset < questionIds.length; offset += 200) {
      const chunk = questionIds.slice(offset, offset + 200);
      const { data, error } = await sb.from("quiz_answer_keys").select("question_id,answer_index").in("question_id", chunk);
      if (error) throw error;
      answerKeys.push(...((data ?? []) as AnswerKeyRow[]));
    }
  }
  const keyByQuestion = new Map(answerKeys.map((key) => [key.question_id, key.answer_index]));
  const quizzes: Quiz[] = rows.map((row) => ({
    id: row.id, title: row.title, description: row.description, courseId: row.course_id ?? undefined,
    createdBy: row.created_by, timeLimitMin: row.time_limit_min, open: row.is_published,
    isCompetition: row.is_competition, createdAt: row.created_at,
    questions: (questionsByQuiz.get(row.id) ?? []).map((question) => ({
      id: question.id, text: question.prompt, options: question.options,
      // Correct answers are never sent to student clients.
      answerIndex: keyByQuestion.get(question.id) ?? -1,
    })),
  }));
  const attemptRows: AttemptRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb.from("quiz_attempts")
      .select("id,quiz_id,student_id,correct_count,total_questions,submitted_at")
      .order("submitted_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as AttemptRow[];
    attemptRows.push(...page);
    if (page.length < pageSize) break;
  }
  return { quizzes, attempts: attemptRows.map(mapAttempt) };
}

/** Validate quiz content and payload sizes before any database writes. */
export function validateBackendQuizInput(input: {
  title: string;
  description: string;
  timeLimitMin: number;
  questions: QuizQuestion[];
}): void {
  // Runtime guards are intentional: values can arrive from untrusted UI or
  // JavaScript callers even when the TypeScript interface says they are strings.
  if (!input || typeof input.title !== "string" || typeof input.description !== "string" ||
    !input.title.trim() || input.title.trim().length > 120 ||
    input.description.length > 2000 ||
    !Number.isInteger(input.timeLimitMin) || input.timeLimitMin < 1 || input.timeLimitMin > 240) {
    throw new Error("عنوان، توضیحات یا مدت آزمون معتبر نیست.");
  }
  if (!Array.isArray(input.questions) || input.questions.length < 1 || input.questions.length > 100) {
    throw new Error("تعداد پرسش‌های آزمون باید بین ۱ تا ۱۰۰ باشد.");
  }
  let totalTextLength = input.title.trim().length + input.description.length;
  for (const question of input.questions) {
    if (!question || typeof question.text !== "string" || !question.text.trim() || question.text.trim().length > 1000 ||
      !Array.isArray(question.options) || question.options.length < 2 || question.options.length > 8 ||
      question.options.some((option) => typeof option !== "string" || !option.trim() || option.trim().length > 300) ||
      new Set(question.options.map((option) => (option as string).trim())).size !== question.options.length ||
      !Number.isInteger(question.answerIndex) || question.answerIndex < 0 ||
      question.answerIndex >= question.options.length) {
      throw new Error("متن پرسش، گزینه‌ها یا پاسخ صحیح کامل و معتبر نیست.");
    }
    totalTextLength += question.text.trim().length + question.options.reduce((sum, option) => sum + (option as string).trim().length, 0);
  }
  if (totalTextLength > 100_000) {
    throw new Error("حجم کلی متن آزمون بیش از حد مجاز است.");
  }
}

export async function createBackendQuiz(
  sb: SupabaseClient,
  user: User,
  input: { title: string; description: string; courseId?: string; timeLimitMin: number; isCompetition: boolean; questions: QuizQuestion[] },
) {
  if (user.role !== "teacher" && user.role !== "admin") throw new Error("فقط استاد یا مدیر می‌تواند آزمون بسازد.");
  validateBackendQuizInput(input);
  const { data: quiz, error: quizError } = await sb.from("quizzes").insert({
    title: input.title.trim(), description: input.description.trim(), course_id: input.courseId ?? null,
    created_by: user.id, time_limit_min: input.timeLimitMin, is_competition: input.isCompetition, is_published: false,
  }).select("id").single();
  if (quizError) throw quizError;
  try {
    const { data: questions, error: questionError } = await sb.from("quiz_questions").insert(input.questions.map((question, index) => ({
      quiz_id: quiz.id, prompt: question.text.trim(), options: question.options.map((option) => option.trim()), position: index + 1,
    }))).select("id,position").order("position", { ascending: true });
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

/** Validate the client payload shape; the database remains authoritative for scoring and authorization. */
export function validateBackendQuizAttemptInput(quizId: unknown, answers: unknown): asserts answers is Record<string, number> {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof quizId !== "string" || !uuidPattern.test(quizId)) {
    throw new Error("شناسه آزمون معتبر نیست.");
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers) ||
    Object.getPrototypeOf(answers) !== Object.prototype) {
    throw new Error("ساختار پاسخ‌ها معتبر نیست.");
  }
  const entries = Object.entries(answers as Record<string, unknown>);
  if (entries.length < 1 || entries.length > 100 ||
    entries.some(([questionId, answer]) => !uuidPattern.test(questionId) ||
      !Number.isInteger(answer) || (answer as number) < 0)) {
    throw new Error("پاسخ‌های آزمون کامل یا معتبر نیستند.");
  }
}

export async function submitBackendQuizAttempt(sb: SupabaseClient, quizId: string, answers: Record<string, number>) {
  validateBackendQuizAttemptInput(quizId, answers);
  const { data, error } = await sb.rpc("submit_quiz_attempt", { p_quiz_id: quizId, p_answers: answers }).single();
  if (error) throw error;
  return data as { attempt_id: string; correct_count: number; total_questions: number; percentage: number };
}
