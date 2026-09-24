import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface GalleryPhoto {
  id: string;
  image_url: string;
  sort_order: number;
}

export default function GallerySection() {
  const [items, setItems] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [openImage, setOpenImage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("id,image_url,sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data ?? []) as GalleryPhoto[]);
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
            Loading gallery…
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed bg-background p-12 text-center text-sm text-muted-foreground">
            No project photos are available yet.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpenImage(item.image_url)}
                className="group overflow-hidden rounded-xl border bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={item.image_url}
                  alt="Project photo"
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {openImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenImage(null)}
        >
          <button
            type="button"
            onClick={() => setOpenImage(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={openImage}
            alt="Project photo enlarged"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
