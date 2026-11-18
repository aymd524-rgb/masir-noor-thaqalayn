import type { ContentItem, ContentSection } from "../domain/types";
import { getSupabase } from "../backend/supabase";

type ContentEntryRow = {
  id: string;
  content_type: string;
  title: string;
  body: string;
  summary: string | null;
  topic: string | null;
  author_name: string | null;
  source_name: string | null;
  source_url: string | null;
  media_url: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

const VALID_SECTIONS = new Set<ContentSection>([
  "quran",
  "ahlulbayt",
  "nahj",
  "sahifa",
  "library",
  "duas",
]);

function isContentSection(value: unknown): value is ContentSection {
  return typeof value === "string" && VALID_SECTIONS.has(value as ContentSection);
}

/**
 * Maps only explicitly categorized, published database entries into the
 * existing content-page model. Entries without a recognized section are
 * intentionally omitted rather than guessed into the wrong part of the app.
 */
function toContentItem(row: ContentEntryRow): ContentItem | null {
  const explicitSection = row.metadata?.section;
  const inferredSection: ContentSection | undefined =
    row.content_type === "hadith"
      ? "ahlulbayt"
      : row.content_type === "library"
        ? "library"
        : row.content_type === "dua" || row.content_type === "ziyarat"
          ? "duas"
          : row.content_type === "munajat"
            ? "sahifa"
            : undefined;

  const section = isContentSection(explicitSection)
    ? explicitSection
    : inferredSection;

  if (!section) return null;

  const arabic = row.metadata?.arabic;
  return {
    id: row.id,
    section,
    title: row.title,
    subtitle: row.summary ?? undefined,
    tag: row.topic ?? row.tags?.[0] ?? undefined,
    author: row.author_name ?? row.source_name ?? undefined,
    arabic: typeof arabic === "string" ? arabic : undefined,
    body: row.body,
    published: row.is_published,
    createdAt: row.created_at,
  };
}

/** Returns published shared content. A null result means demo mode is active. */
export async function fetchSharedContent(): Promise<ContentItem[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("content_entries")
    .select(
      "id,content_type,title,body,summary,topic,author_name,source_name,source_url,media_url,tags,metadata,is_published,sort_order,created_at",
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`بارگذاری محتوای مشترک ناموفق بود: ${error.message}`);
  }

  return ((data ?? []) as ContentEntryRow[])
    .map(toContentItem)
    .filter((item): item is ContentItem => item !== null);
}
