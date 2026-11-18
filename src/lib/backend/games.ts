import type { SupabaseClient } from "@supabase/supabase-js";

export type GameType = "multiple_choice" | "true_false" | "word_order" | "concept_guess";
export type GameAgeGroup = "kids" | "teens";

export type GameQuestion = {
  id: string;
  game_type: GameType;
  prompt: string;
  options: unknown[];
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  age_group: GameAgeGroup;
};

export async function fetchPublishedGameQuestions(
  sb: SupabaseClient,
  ageGroup: GameAgeGroup,
): Promise<GameQuestion[]> {
  const { data, error } = await sb
    .from("game_questions")
    .select("id,game_type,prompt,options,explanation,topic,difficulty,age_group")
    .eq("is_published", true)
    .eq("age_group", ageGroup)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`دریافت پرسش‌های بازی انجام نشد: ${error.message}`);
  return (data ?? []) as GameQuestion[];
}

/**
 * The correct answer remains in private.game_answer_keys. This RPC compares
 * the submitted JSON value on the server and returns only a boolean result.
 */
export async function checkPublishedGameAnswer(
  sb: SupabaseClient,
  questionId: string,
  selectedAnswer: unknown,
): Promise<boolean> {
  const { data, error } = await sb.rpc("check_game_answer", {
    p_question_id: questionId,
    p_selected_answer: selectedAnswer,
  });

  if (error) throw new Error(`بررسی پاسخ انجام نشد: ${error.message}`);
  return data === true;
}

export type AdminGameQuestionInput = {
  gameType: GameType;
  prompt: string;
  options: string[];
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  ageGroup: GameAgeGroup;
  answerPayload: number | string[];
};

export type AdminGameQuestion = GameQuestion & {
  is_published: boolean;
  created_at: string;
};

export async function fetchAdminGameQuestions(sb: SupabaseClient): Promise<AdminGameQuestion[]> {
  const { data, error } = await sb
    .from("game_questions")
    .select("id,game_type,prompt,options,explanation,topic,difficulty,age_group,is_published,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`دریافت فهرست پرسش‌ها انجام نشد: ${error.message}`);
  return (data ?? []) as AdminGameQuestion[];
}

export async function createAdminGameQuestion(
  sb: SupabaseClient,
  input: AdminGameQuestionInput,
): Promise<string> {
  const { data, error } = await sb.rpc("admin_create_game_question", {
    p_game_type: input.gameType,
    p_prompt: input.prompt.trim(),
    p_options: input.options,
    p_explanation: input.explanation.trim(),
    p_topic: input.topic.trim(),
    p_difficulty: input.difficulty,
    p_age_group: input.ageGroup,
    p_answer_payload: input.answerPayload,
    p_is_published: false,
  });

  if (error) throw new Error(`ذخیره پرسش انجام نشد: ${error.message}`);
  if (typeof data !== "string") throw new Error("شناسه پرسش جدید از پایگاه داده دریافت نشد.");
  return data;
}

export async function setAdminGameQuestionPublished(
  sb: SupabaseClient,
  questionId: string,
  published: boolean,
): Promise<void> {
  const { data, error } = await sb
    .from("game_questions")
    .update({ is_published: published, updated_at: new Date().toISOString() })
    .eq("id", questionId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`تغییر وضعیت انتشار انجام نشد: ${error.message}`);
  if (!data) throw new Error("پرسش تغییر نکرد؛ دسترسی مدیر را بررسی کنید.");
}
