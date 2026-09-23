import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, UploadCloud } from "lucide-react";

interface GalleryPair {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  after_image_url: string | null;
  sort_order: number;
}

const initialForm = { title: "", description: "", sort_order: 0 };

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryPair[]>([]);
  const [form, setForm] = useState(initialForm);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id,title,description,image_url,after_image_url,sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      toast.error(error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as GalleryPair[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function uploadImage(file: File, userId: string) {
    const path = `gallery/${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("gallery-images").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("gallery-images").getPublicUrl(path).data.publicUrl;
  }

  async function handleUploadAndSave() {
    if (!form.title.trim()) {
      toast.error("Please enter a project title.");
      return;
    }
    if (!beforeFile || !afterFile) {
      toast.error("Please choose both a before and an after image.");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be signed in.");
      const [beforeUrl, afterUrl] = await Promise.all([
        uploadImage(beforeFile, userData.user.id),
        uploadImage(afterFile, userData.user.id),
      ]);
      const { error } = await supabase.from("gallery_items").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        image_url: beforeUrl,
        after_image_url: afterUrl,
        stage: "before",
        sort_order: Number(form.sort_order) || 0,
        created_by: userData.user.id,
      });
      if (error) throw error;
      setForm(initialForm);
      setBeforeFile(null);
      setAfterFile(null);
      toast.success("Project pair added to the gallery.");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload gallery pair");
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
    toast.success("Gallery pair removed.");
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  return (
    <section className="mt-8 rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold tracking-tight">Photo gallery</h2>
      <p className="text-sm text-muted-foreground">Add a before-and-after pair for a project.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border bg-background p-4">
          <div><label className="mb-1 block text-sm font-medium">Project title</label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Example: Kitchen renovation" /></div>
          <div><label className="mb-1 block text-sm font-medium">Description</label><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Short project description" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">Before image</label><Input type="file" accept="image/*" onChange={(event) => setBeforeFile(event.target.files?.[0] ?? null)} /></div>
            <div><label className="mb-1 block text-sm font-medium">After image</label><Input type="file" accept="image/*" onChange={(event) => setAfterFile(event.target.files?.[0] ?? null)} /></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium">Sort order</label><Input type="number" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))} /></div>
          <Button onClick={handleUploadAndSave} disabled={saving} className="w-full"><UploadCloud className="mr-2 h-4 w-4" />{saving ? "Uploading..." : "Add pair to gallery"}</Button>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">Current entries</h3>
          {loading ? <p className="mt-3 text-sm text-muted-foreground">Loading gallery items...</p> : items.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No gallery items yet.</p> : <div className="mt-3 space-y-3">{items.map((item) => <div key={item.id} className="flex gap-3 rounded-lg border p-2"><img src={item.image_url} alt={`${item.title} - before`} className="h-16 w-16 rounded-md object-cover" />{item.after_image_url && <img src={item.after_image_url} alt={`${item.title} - after`} className="h-16 w-16 rounded-md object-cover" />}<div className="min-w-0 flex-1"><p className="truncate font-medium">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description || "No description"}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(item.id)} aria-label={`Delete ${item.title}`}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}
        </div>
      </div>
    </section>
  );
}
