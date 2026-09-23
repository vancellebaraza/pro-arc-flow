import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageOff } from "lucide-react";

interface GalleryPair {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  after_image_url: string | null;
  sort_order: number;
}

export default function GallerySection() {
  const [items, setItems] = useState<GalleryPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("id,title,description,image_url,after_image_url,sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!active) return;
      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data ?? []) as GalleryPair[]);
      }
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="gallery" className="border-t bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Portfolio
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Gallery of our recent work
          </h2>
        </div>

        {loading ? (
          <div className="mt-8 rounded-xl border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
            Loading gallery...
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
            No project photos are available yet.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <article key={item.id} className="group overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="grid grid-cols-2 gap-px bg-border">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img src={item.image_url} alt={`${item.title} - before`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <span className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm">Before</span>
                    </div>
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {item.after_image_url ? (
                        <img src={item.after_image_url} alt={`${item.title} - after`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-6 w-6" /></div>
                      )}
                      <span className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm">After</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    {item.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {expanded ? item.description : item.description.slice(0, 90)}
                      </p>
                    )}
                    {item.description && item.description.length > 90 && (
                      <button type="button" className="mt-2 text-xs font-medium text-primary hover:underline" onClick={() => setExpandedId(expanded ? null : item.id)}>
                        {expanded ? "Hide details" : "Read more"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Before / After project pairs
        </div>
      </div>
    </section>
  );
}
