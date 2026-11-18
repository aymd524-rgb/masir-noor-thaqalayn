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
  const rows: GameQuestion[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from("game_questions")
      .select("id,game_type,prompt,options,explanation,topic,difficulty,age_group")
      .eq("is_published", true)
      .eq("age_group", ageGroup)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`دریافت پرسش‌های بازی انجام نشد: ${error.message}`);
    const page = (data ?? []) as GameQuestion[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
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

/** Validate administrator game-question input before invoking the database RPC. */
export function validateAdminGameQuestionInput(input: AdminGameQuestionInput): void {
  if (!["multiple_choice", "true_false", "word_order", "concept_guess"].includes(input.gameType) ||
    !["kids", "teens"].includes(input.ageGroup) ||
    !["easy", "medium", "hard"].includes(input.difficulty)) {
    throw new Error("نوع بازی، گروه سنی یا سطح دشواری معتبر نیست.");
  }
  if (typeof input.prompt !== "string" || !input.prompt.trim() || input.prompt.trim().length > 1200 ||
    typeof input.topic !== "string" || !input.topic.trim() || input.topic.trim().length > 120 ||
    typeof input.explanation !== "string" || input.explanation.length > 2000) {
    throw new Error("متن پرسش، موضوع یا توضیح پاسخ معتبر نیست.");
  }
  if (!Array.isArray(input.options) || input.options.length < 2 || input.options.length > 8 ||
    input.options.some((option) => typeof option !== "string" || !option.trim() || option.trim().length > 300) ||
    new Set(input.options.map((option) => option.trim())).size !== input.options.length) {
    throw new Error("گزینه‌ها باید ۲ تا ۸ متن غیرتکراری و حداکثر ۳۰۰ نویسه‌ای باشند.");
  }
  if (input.gameType === "true_false" && input.options.length !== 2) {
    throw new Error("بازی درست یا نادرست باید دقیقاً دو گزینه داشته باشد.");
  }
  if (input.gameType === "word_order") {
    if (!Array.isArray(input.answerPayload) || input.answerPayload.length !== input.options.length ||
      input.answerPayload.some((part) => typeof part !== "string" || !input.options.includes(part)) ||
      new Set(input.answerPayload).size !== input.options.length) {
      throw new Error("ترتیب پاسخ باید همه گزینه‌ها را دقیقاً یک‌بار شامل شود.");
    }
  } else if (!Number.isInteger(input.answerPayload) || input.answerPayload < 0 || input.answerPayload >= input.options.length) {
    throw new Error("شماره پاسخ صحیح معتبر نیست.");
  }
}



export async function fetchAdminGameQuestions(sb: SupabaseClient): Promise<AdminGameQuestion[]> {
  const rows: AdminGameQuestion[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from("game_questions")
      .select("id,game_type,prompt,options,explanation,topic,difficulty,age_group,is_published,created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`دریافت فهرست پرسش‌ها انجام نشد: ${error.message}`);
    const page = (data ?? []) as AdminGameQuestion[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function createAdminGameQuestion(
  sb: SupabaseClient,
  input: AdminGameQuestionInput,
): Promise<string> {
  validateAdminGameQuestionInput(input);
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
