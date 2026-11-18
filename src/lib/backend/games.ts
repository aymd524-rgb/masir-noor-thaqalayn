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
