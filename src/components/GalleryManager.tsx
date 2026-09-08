import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, UploadCloud } from "lucide-react";

export type GalleryStage = "before" | "during" | "after";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  stage: GalleryStage;
  image_url: string;
  sort_order: number;
}

const initialForm = {
  title: "",
  description: "",
  stage: "before" as GalleryStage,
  sort_order: 0,
};

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id,title,description,stage,image_url,sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      toast.error(error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as GalleryItem[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  async function handleUploadAndSave() {
    if (!form.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (!imageFile) {
      toast.error("Please choose an image.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be signed in.");

      const path = `gallery/${userData.user.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("gallery-images")
        .upload(path, imageFile);
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("gallery-images").getPublicUrl(path);

      const { error } = await supabase.from("gallery_items").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        stage: form.stage,
        image_url: publicData.publicUrl,
        sort_order: Number(form.sort_order) || 0,
        created_by: userData.user.id,
      });

      if (error) throw error;

      setForm(initialForm);
      setImageFile(null);
      toast.success("Gallery photo added.");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload gallery item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    const { error } = await supabase.from("gallery_items").delete().eq("id", itemId);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Gallery item removed.");
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  return (
    <section className="mt-8 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Photo gallery</h2>
          <p className="text-sm text-muted-foreground">
            Add work-in-progress visuals for before, during, and after stages.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border bg-background p-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Example: Kitchen renovation"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={3}
              placeholder="Short description of the project stage"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Stage</label>
              <select
                value={form.stage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, stage: event.target.value as GalleryStage }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="before">Before</option>
                <option value="during">During</option>
                <option value="after">After</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Sort order</label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sort_order: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Image</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <Button onClick={handleUploadAndSave} disabled={saving} className="w-full">
            <UploadCloud className="mr-2 h-4 w-4" />
            {saving ? "Uploading..." : "Add to gallery"}
          </Button>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Current entries
          </h3>

          {loading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading gallery items…</p>
          ) : items.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No gallery items yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg border p-2">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{item.title}</p>
                      <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        {item.stage}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.description || "No description"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
