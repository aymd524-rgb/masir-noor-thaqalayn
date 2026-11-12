import { BookOpenText, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/common/states";
import { PageHeader, SectionTitle } from "@/components/common/ui-bits";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ContentItem, ContentSection } from "@/lib/domain/types";
import { useDb } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ContentSectionPage({
  section,
  title,
  subtitle,
  icon,
  listTitle = "مطالب",
  before,
  after,
}: {
  section: ContentSection;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  listTitle?: string;
  before?: ReactNode;
  after?: ReactNode;
}) {
  const db = useDb();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContentItem | null>(null);

  const items = useMemo(() => db.content.filter((c) => c.section === section && c.published), [db, section]);
  const tags = useMemo(() => Array.from(new Set(items.map((i) => i.tag).filter(Boolean))) as string[], [items]);
  const filtered = items.filter((i) => {
    const q = query.trim();
    const matchQ = !q || [i.title, i.subtitle, i.body, i.author, i.arabic].some((f) => f?.includes(q));
    return matchQ && (!tag || i.tag === tag);
  });

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} icon={icon}>
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <label htmlFor={`search-${section}`} className="sr-only">
            جستجو در {title}
          </label>
          <Input
            id={`search-${section}`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`جستجو در ${title}…`}
            className="h-12 border-transparent ps-10 text-foreground shadow-elegant"
          />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        {before}

        <section aria-labelledby={`list-${section}`}>
          <SectionTitle title={listTitle} />
          <span id={`list-${section}`} className="sr-only">
            {listTitle}
          </span>
          {tags.length > 1 && (
            <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="فیلتر دسته">
              <Chip active={!tag} onClick={() => setTag(null)}>
                همه
              </Chip>
              {tags.map((t) => (
                <Chip key={t} active={tag === t} onClick={() => setTag(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              icon={BookOpenText}
              title="موردی یافت نشد"
              description={items.length === 0 ? "هنوز مطلبی در این بخش منتشر نشده است." : "عبارت جستجو یا فیلتر را تغییر دهید."}
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setSelected(item)}
                    className="group flex h-full w-full flex-col rounded-2xl border bg-card-gradient p-4 text-start shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-primary-deep">{item.title}</h3>
                      {item.tag && <Badge variant="gold">{item.tag}</Badge>}
                    </div>
                    {(item.subtitle || item.author) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[item.subtitle, item.author].filter(Boolean).join(" — ")}
                      </p>
                    )}
                    {item.arabic && (
                      <p lang="ar" dir="rtl" className="font-arabic mt-3 line-clamp-2 text-lg text-primary">
                        {item.arabic}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
                    <span className="mt-auto pt-3 text-xs font-bold text-primary group-hover:underline">
                      {section === "library" ? "مطالعه معرفی کتاب" : "مطالعه کامل"} ←
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {after}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-primary-deep">{selected.title}</DialogTitle>
                <DialogDescription>{[selected.subtitle, selected.author].filter(Boolean).join(" — ")}</DialogDescription>
              </DialogHeader>
              {selected.arabic && (
                <div className="bg-gold-soft pattern-stars rounded-2xl p-4 text-center">
                  <p lang="ar" dir="rtl" className="font-arabic text-2xl text-primary-deep">
                    {selected.arabic}
                  </p>
                </div>
              )}
              <p className="leading-8 text-foreground">{selected.body}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}