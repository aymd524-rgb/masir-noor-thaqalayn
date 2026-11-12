export interface MushafWord {
  text: string;
  /** "end" = ayah-number marker supplied by the source */
  kind: "word" | "end";
  surah: number;
  ayah: number;
}

export type MushafLine =
  | { kind: "ayah"; words: MushafWord[] }
  | { kind: "surah-header"; surah: number }
  | { kind: "basmala" }
  /** Demo only: a slot where a real line of text will appear once a licensed source is connected. */
  | { kind: "placeholder" }
  | { kind: "empty" };

export interface MushafPageData {
  page: number;
  /** Always exactly 15 slots, in mushaf order. */
  lines: MushafLine[];
  /** Basmala words as supplied by the source (never typed by hand). */
  basmala?: string[];
  /** Present only when the lines contain real text from a cited source (otherwise demo/placeholder). */
  provenance?: { label: string; attribution: string };
}

export interface MushafSource {
  id: string;
  /** True when no verified text/pagination is connected. */
  demo: boolean;
  name: string;
  attribution: string;
  getPage(page: number, signal?: AbortSignal): Promise<MushafPageData>;
}