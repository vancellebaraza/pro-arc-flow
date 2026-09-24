import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, UploadCloud } from "lucide-react";

interface GalleryPhoto {
  id: string;
  image_url: string;
  sort_order: number;
}

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id,image_url,sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      toast.error(error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as GalleryPhoto[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const imageExtensions = /\.(avif|gif|jpe?g|png|webp)$/i;
    const imageFiles = Array.from(files).filter(
      (file) => file.type.startsWith("image/") || imageExtensions.test(file.name),
    );
    if (imageFiles.length === 0) {
      toast.error("Please choose a JPG, PNG, WEBP, GIF, or AVIF image.");
      return;
    }

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be signed in.");

      const failures: string[] = [];

      for (const file of imageFiles) {
        try {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
          const path = `gallery/${userData.user.id}/${crypto.randomUUID()}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("gallery-images")
            .upload(path, file);
          if (uploadError) throw uploadError;

          const { data: publicData } = supabase.storage.from("gallery-images").getPublicUrl(path);

          const { error: insertError } = await supabase.from("gallery_items").insert({
            title: file.name,
            image_url: publicData.publicUrl,
            // "stage" and "after_image_url" predate this drag-and-drop model and
            // are no longer used — kept only because the column is still required.
            stage: "before",
            sort_order: 0,
            created_by: userData.user.id,
          });
          if (insertError) throw insertError;
        } catch (error) {
          failures.push(error instanceof Error ? error.message : `Unable to upload ${file.name}`);
        }
      }

      if (failures.length === 0) {
        toast.success(
          imageFiles.length === 1
            ? "Photo added to the gallery."
            : `${imageFiles.length} photos added.`,
        );
      } else {
        toast.error(`${failures.length} of ${imageFiles.length} photo(s) failed: ${failures[0]}`);
      }

      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload photos");
    } finally {
      setUploading(false);
    }
  }, []);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files?.length) {
      void uploadFiles(event.dataTransfer.files);
    }
  }

  async function handleDelete(itemId: string) {
    const { error } = await supabase.from("gallery_items").delete().eq("id", itemId);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Photo removed.");
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  return (
    <section className="mt-8 rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold tracking-tight">Photo gallery</h2>
      <p className="text-sm text-muted-foreground">
        Drag and drop finished photos here. Each photo should already contain all the description
        text it needs — nothing else to fill in.
      </p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-background"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drag photos here, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">You can drop multiple photos at once.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) void uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Current photos
        </h3>

        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading gallery photos…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No photos yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-lg border">
                <img
                  src={item.image_url}
                  alt="Gallery photo"
                  className="aspect-square w-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete photo"
                  className="absolute right-2 top-2 h-7 w-7 opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
