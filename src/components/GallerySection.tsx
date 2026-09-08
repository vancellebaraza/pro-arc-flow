import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageOff, Layers3 } from "lucide-react";

export type GalleryStage = "before" | "during" | "after";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  stage: GalleryStage;
  image_url: string;
  sort_order: number;
}

const stageLabels: Record<GalleryStage | "all", string> = {
  all: "All",
  before: "Before",
  during: "During",
  after: "After",
};

export default function GallerySection() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState<GalleryStage | "all">("all");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery_items")
        .select("id,title,description,stage,image_url,sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data ?? []) as GalleryItem[]);
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.stage === filter);
  }, [filter, items]);

  return (
    <section id="gallery" className="border-t bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Portfolio
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Gallery of our recent work
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(stageLabels) as Array<GalleryStage | "all">).map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setFilter(stage)}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  filter === stage
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {stageLabels[stage]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-xl border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
            Loading gallery…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
            No project photos are available yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => setExpandedId((current) => (current === item.id ? null : item.id))}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(event) => {
                        const target = event.currentTarget;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.classList.add("bg-muted");
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition group-hover:opacity-100">
                      <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                        {stageLabels[item.stage]}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {stageLabels[item.stage]}
                      </span>
                    </div>

                    {(expanded || item.description) && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {expanded
                          ? item.description || "No description provided."
                          : item.description?.slice(0, 80) || "No description provided."}
                      </p>
                    )}

                    {item.description && item.description.length > 80 && (
                      <button
                        type="button"
                        className="mt-3 text-xs font-medium text-primary hover:underline"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedId((current) => (current === item.id ? null : item.id));
                        }}
                      >
                        {expanded ? "Hide details" : "Read more"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Layers3 className="h-3.5 w-3.5" />
          Before • During • After
        </div>
      </div>
    </section>
  );
}
