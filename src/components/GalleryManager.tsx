import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  confirmGalleryVideos,
  createGalleryVideoUpload,
  deleteGalleryVideos,
} from "@/lib/gallery-video.functions";
import { MAX_VIDEO_BYTES, isVideoUrl, videoContentType } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Film, Trash2, UploadCloud, X } from "lucide-react";

const BUCKET = "gallery-images";
const MAX_PER_SIDE = 3;
const MAX_TEXT = 600;
const MAX_DIMENSION = 2000;

interface GallerySet {
  id: string;
  before_images: string[];
  after_images: string[];
  before_text: string;
  after_text: string;
  title: string;
  subtitle: string;
  before_heading: string;
  after_heading: string;
  footer_tags: string[];
}

const IMAGE_EXT = /\.(avif|gif|jpe?g|png|webp)$/i;
const isImage = (file: File) => file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
const isVideo = (file: File) => videoContentType(file) !== null;

const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// fetch() can't report upload progress, so videos go through XMLHttpRequest.
function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Video upload failed (error ${xhr.status}). Please try again.`));
    xhr.onerror = () =>
      reject(new Error("The video could not be uploaded. Check your connection and try again."));
    xhr.send(file);
  });
}

function Thumb({ url, alt }: { url: string; alt: string }) {
  return isVideoUrl(url) ? (
    <video
      src={`${url}#t=0.1`}
      preload="metadata"
      muted
      playsInline
      aria-label={alt}
      className="aspect-square w-full object-cover"
    />
  ) : (
    <img src={url} alt={alt} className="aspect-square w-full object-cover" />
  );
}

// Phone photos are often 5-10 MB. Shrink and re-encode before upload so the
// public gallery loads fast. Falls back to the original file on any failure.
async function prepareImage(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  const original = {
    blob: file as Blob,
    ext: (file.name.split(".").pop() || "jpg").toLowerCase(),
    type: file.type || "image/jpeg",
  };
  if (file.type === "image/gif") return original;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const toBlob = (type: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));

    let blob = await toBlob("image/webp");
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
    if (!blob || blob.size >= file.size) return original;

    return { blob, ext: blob.type === "image/webp" ? "webp" : "jpg", type: blob.type };
  } catch {
    return original;
  }
}

function pathFromUrl(url: string) {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

function SidePicker({
  label,
  files,
  onChange,
  disabled,
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function add(incoming: FileList | File[]) {
    const accepted: File[] = [];
    for (const file of Array.from(incoming)) {
      if (isImage(file)) {
        accepted.push(file);
      } else if (isVideo(file)) {
        if (file.size > MAX_VIDEO_BYTES) {
          toast.error(`${file.name} is ${formatMB(file.size)}. Videos can be at most 200 MB.`);
        } else {
          accepted.push(file);
        }
      } else {
        toast.error(`${file.name} isn't supported. Use photos, or MP4, WebM or MOV videos.`);
      }
    }
    if (accepted.length === 0) return;

    const room = MAX_PER_SIDE - files.length;
    if (accepted.length > room) {
      toast.error(`${label} accepts up to ${MAX_PER_SIDE} photos or videos in total.`);
    }
    if (room > 0) onChange([...files, ...accepted.slice(0, room)]);
  }

  const full = files.length >= MAX_PER_SIDE;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label} photos or videos</Label>
        <span className="text-xs text-muted-foreground">
          {files.length}/{MAX_PER_SIDE}
        </span>
      </div>

      {!full && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (!disabled && event.dataTransfer.files?.length) add(event.dataTransfer.files);
          }}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-6 text-center transition ${
            dragOver ? "border-primary bg-primary/5" : "border-border bg-background"
          }`}
        >
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Drag photos or videos here, or click to browse</p>
          <p className="text-xs text-muted-foreground">Videos: MP4, WebM or MOV, up to 200 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime,.mov"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) add(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={src} className="group relative overflow-hidden rounded-lg border">
              {isVideo(files[i]) ? (
                <>
                  <video
                    src={`${src}#t=0.1`}
                    preload="metadata"
                    muted
                    playsInline
                    aria-label={`${label} video preview ${i + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    <Film className="h-3 w-3" />
                    {formatMB(files[i].size)}
                  </span>
                </>
              ) : (
                <img
                  src={src}
                  alt={`${label} preview ${i + 1}`}
                  className="aspect-square w-full object-cover"
                />
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${label} item ${i + 1}`}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white transition hover:bg-black"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GalleryManager() {
  const [sets, setSets] = useState<GallerySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  const requestVideoUpload = useServerFn(createGalleryVideoUpload);
  const confirmVideos = useServerFn(confirmGalleryVideos);
  const removeVideos = useServerFn(deleteGalleryVideos);

  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [afterFiles, setAfterFiles] = useState<File[]>([]);
  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [beforeHeading, setBeforeHeading] = useState("");
  const [afterHeading, setAfterHeading] = useState("");
  const [footerTags, setFooterTags] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery_sets")
      .select(
        "id,before_images,after_images,before_text,after_text,title,subtitle,before_heading,after_heading,footer_tags",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setSets([]);
    } else {
      setSets((data ?? []) as GallerySet[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function uploadImage(file: File, userId: string, uploadedPaths: string[]) {
    const { blob, ext, type } = await prepareImage(file);
    const path = `gallery/${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: type, cacheControl: "31536000" });
    if (error) throw error;
    uploadedPaths.push(path);
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function uploadVideo(
    file: File,
    uploadedVideos: string[],
    onProgress: (fraction: number) => void,
  ) {
    const contentType = videoContentType(file);
    if (!contentType) throw new Error(`${file.name} is not a supported video.`);

    const { uploadUrl, publicUrl } = await requestVideoUpload({
      data: { contentType, size: file.size },
    });
    await putWithProgress(uploadUrl, file, contentType, onProgress);
    uploadedVideos.push(publicUrl);
    return publicUrl;
  }

  // Photos upload in parallel. Videos upload one at a time so a phone on mobile
  // data isn't sending several large files at once.
  async function uploadMedia(
    before: File[],
    after: File[],
    userId: string,
    uploadedPaths: string[],
    uploadedVideos: string[],
  ) {
    const jobs = [
      ...before.map((file, index) => ({ side: "before" as const, index, file })),
      ...after.map((file, index) => ({ side: "after" as const, index, file })),
    ];
    const results = {
      before: new Array<string>(before.length),
      after: new Array<string>(after.length),
    };

    await Promise.all(
      jobs
        .filter((job) => !isVideo(job.file))
        .map(async (job) => {
          results[job.side][job.index] = await uploadImage(job.file, userId, uploadedPaths);
        }),
    );

    const videoJobs = jobs.filter((job) => isVideo(job.file));
    for (let i = 0; i < videoJobs.length; i += 1) {
      const job = videoJobs[i];
      setVideoProgress((i + 0) / videoJobs.length);
      results[job.side][job.index] = await uploadVideo(job.file, uploadedVideos, (fraction) =>
        setVideoProgress((i + fraction) / videoJobs.length),
      );
    }

    if (uploadedVideos.length > 0) await confirmVideos({ data: { urls: uploadedVideos } });

    return results;
  }

  async function publish() {
    if (beforeFiles.length === 0 || afterFiles.length === 0) {
      toast.error("Add at least one before item and one after item.");
      return;
    }

    setPublishing(true);
    const uploaded: string[] = [];
    const uploadedVideos: string[] = [];
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("You must be signed in.");

      const { before: beforeUrls, after: afterUrls } = await uploadMedia(
        beforeFiles,
        afterFiles,
        userData.user.id,
        uploaded,
        uploadedVideos,
      );

      const { error } = await supabase.from("gallery_sets").insert({
        before_images: beforeUrls,
        after_images: afterUrls,
        before_text: beforeText.trim(),
        after_text: afterText.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        before_heading: beforeHeading.trim(),
        after_heading: afterHeading.trim(),
        footer_tags: footerTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 3),
        created_by: userData.user.id,
      });
      if (error) throw error;

      toast.success("Project added to the gallery.");
      setBeforeFiles([]);
      setAfterFiles([]);
      setBeforeText("");
      setAfterText("");
      setTitle("");
      setSubtitle("");
      setBeforeHeading("");
      setAfterHeading("");
      setFooterTags("");
      void load();
    } catch (error) {
      // Don't leave orphaned files behind if the upload or insert failed.
      if (uploaded.length > 0) await supabase.storage.from(BUCKET).remove(uploaded);
      if (uploadedVideos.length > 0) {
        await removeVideos({ data: { urls: uploadedVideos } }).catch(() => undefined);
      }
      toast.error(error instanceof Error ? error.message : "Unable to publish this project.");
    } finally {
      setPublishing(false);
      setVideoProgress(null);
    }
  }

  async function handleDelete(set: GallerySet) {
    if (!window.confirm("Delete this before/after project from the gallery?")) return;

    const { error } = await supabase.from("gallery_sets").delete().eq("id", set.id);
    if (error) {
      toast.error(error.message);
      return;
    }

    const media = [...set.before_images, ...set.after_images];

    const paths = media
      .filter((url) => !isVideoUrl(url))
      .map(pathFromUrl)
      .filter((p): p is string => Boolean(p));
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);

    const videos = media.filter(isVideoUrl);
    if (videos.length > 0) await removeVideos({ data: { urls: videos } }).catch(() => undefined);

    toast.success("Project removed.");
    setSets((current) => current.filter((item) => item.id !== set.id));
  }

  return (
    <section className="mt-8 rounded-xl border bg-card p-5">
      <h2 className="text-lg font-semibold tracking-tight">Photo gallery</h2>
      <p className="text-sm text-muted-foreground">
        Each project shows on the public gallery page as one before/after slide. Add 1 to 3 photos
        or videos for each side (3 in total per side) and a short description under each.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="gallery-title" className="text-sm font-medium">
            Project title
          </Label>
          <Input
            id="gallery-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            placeholder="From Risk to Reliability"
            className="mt-2"
            disabled={publishing}
          />
        </div>
        <div>
          <Label htmlFor="gallery-subtitle" className="text-sm font-medium">
            Subtitle
          </Label>
          <Input
            id="gallery-subtitle"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            maxLength={140}
            placeholder="We don't just fix — we restore, protect and build for the long run."
            className="mt-2"
            disabled={publishing}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <SidePicker
            label="Before"
            files={beforeFiles}
            onChange={setBeforeFiles}
            disabled={publishing}
          />
          <div>
            <Label htmlFor="gallery-before-heading" className="text-sm font-medium">
              Before heading
            </Label>
            <Input
              id="gallery-before-heading"
              value={beforeHeading}
              onChange={(event) => setBeforeHeading(event.target.value)}
              maxLength={60}
              placeholder="Damaged & Unsafe"
              className="mt-2"
              disabled={publishing}
            />
          </div>
          <div>
            <Label htmlFor="gallery-before-text" className="text-sm font-medium">
              Before description
            </Label>
            <Textarea
              id="gallery-before-text"
              value={beforeText}
              onChange={(event) => setBeforeText(event.target.value)}
              maxLength={MAX_TEXT}
              rows={4}
              placeholder="One point per line. Each line shows as a bullet."
              className="mt-2"
              disabled={publishing}
            />
          </div>
        </div>

        <div className="space-y-4">
          <SidePicker
            label="After"
            files={afterFiles}
            onChange={setAfterFiles}
            disabled={publishing}
          />
          <div>
            <Label htmlFor="gallery-after-heading" className="text-sm font-medium">
              After heading
            </Label>
            <Input
              id="gallery-after-heading"
              value={afterHeading}
              onChange={(event) => setAfterHeading(event.target.value)}
              maxLength={60}
              placeholder="Secure, Durable & Clean"
              className="mt-2"
              disabled={publishing}
            />
          </div>
          <div>
            <Label htmlFor="gallery-after-text" className="text-sm font-medium">
              After description
            </Label>
            <Textarea
              id="gallery-after-text"
              value={afterText}
              onChange={(event) => setAfterText(event.target.value)}
              maxLength={MAX_TEXT}
              rows={4}
              placeholder="One point per line. Each line shows as a bullet."
              className="mt-2"
              disabled={publishing}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="gallery-footer" className="text-sm font-medium">
          Footer tags (up to 3, separated by commas)
        </Label>
        <Input
          id="gallery-footer"
          value={footerTags}
          onChange={(event) => setFooterTags(event.target.value)}
          placeholder="Safer communities, Better infrastructure, Lasting solutions"
          className="mt-2"
          disabled={publishing}
        />
      </div>

      <Button
        type="button"
        onClick={publish}
        disabled={publishing || beforeFiles.length === 0 || afterFiles.length === 0}
        className="mt-5"
      >
        {publishing
          ? videoProgress !== null
            ? `Uploading video… ${Math.round(videoProgress * 100)}%`
            : "Publishing…"
          : "Publish to gallery"}
      </Button>

      <div className="mt-8">
        <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Published projects
        </h3>

        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading projects…</p>
        ) : sets.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => (
              <div
                key={set.id}
                className="relative overflow-hidden rounded-lg border bg-background"
              >
                <div className="grid grid-cols-2">
                  <Thumb url={set.before_images[0]} alt="Before" />
                  <Thumb url={set.after_images[0]} alt="After" />
                </div>
                <div className="space-y-1 p-3 text-xs text-muted-foreground">
                  {set.title && (
                    <p className="truncate text-sm font-medium text-foreground">{set.title}</p>
                  )}
                  <p className="line-clamp-2">
                    <span className="font-medium text-foreground">Before:</span>{" "}
                    {set.before_text || "—"} ({set.before_images.length} item
                    {set.before_images.length > 1 ? "s" : ""})
                  </p>
                  <p className="line-clamp-2">
                    <span className="font-medium text-foreground">After:</span>{" "}
                    {set.after_text || "—"} ({set.after_images.length} item
                    {set.after_images.length > 1 ? "s" : ""})
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(set)}
                  aria-label="Delete project"
                  className="absolute right-2 top-2 h-7 w-7"
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
