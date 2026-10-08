import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { MAX_VIDEO_BYTES, VIDEO_EXT_BY_TYPE } from "@/lib/media";

// Gallery videos live in a Cloudflare R2 bucket. The browser uploads straight
// to R2 using a short-lived presigned URL created here, so large files never
// pass through the server and the R2 keys never reach the browser.

const UPLOAD_URL_TTL_SECONDS = 900;
const KEY_PATTERN = /^gallery\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp4|webm|mov)$/;

async function assertMiniAdminOrAdmin(supabase: { from: (t: string) => any }, userId: string) {
  const { data: roleRows, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error("Could not verify your permissions.");
  const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("mini_admin") && !roles.includes("admin")) {
    throw new Error("Forbidden: only the mini admin or admin can upload gallery videos.");
  }
}

async function getR2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");

  const missing = Object.entries({
    R2_ACCOUNT_ID: accountId,
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
    R2_BUCKET: bucket,
    R2_PUBLIC_URL: publicUrl,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(`[R2] Missing environment variable(s): ${missing.join(", ")}`);
    throw new Error("Video storage is not configured yet.");
  }

  const { AwsClient } = await import("aws4fetch");
  const client = new AwsClient({
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    service: "s3",
    region: "auto",
  });

  const objectUrl = (key: string) =>
    `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

  return { client, objectUrl, publicUrl: publicUrl! };
}

// Turns a public video URL back into an R2 key, and refuses anything that
// isn't a gallery video we created. This stops the endpoints below from being
// used to touch other objects in the bucket.
function keyFromPublicUrl(url: string, publicUrl: string): string | null {
  if (!url.startsWith(`${publicUrl}/`)) return null;
  const key = url.slice(publicUrl.length + 1);
  return KEY_PATTERN.test(key) ? key : null;
}

const CreateUploadInput = z.object({
  contentType: z.enum(Object.keys(VIDEO_EXT_BY_TYPE) as [keyof typeof VIDEO_EXT_BY_TYPE]),
  size: z.number().int().positive().max(MAX_VIDEO_BYTES, "Videos can be at most 200 MB."),
});

export const createGalleryVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateUploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertMiniAdminOrAdmin(supabase, userId);

    const { client, objectUrl, publicUrl } = await getR2();
    const ext = VIDEO_EXT_BY_TYPE[data.contentType];
    const key = `gallery/${userId}/${crypto.randomUUID()}.${ext}`;

    const url = new URL(objectUrl(key));
    url.searchParams.set("X-Amz-Expires", String(UPLOAD_URL_TTL_SECONDS));

    // Content-Type is part of the signature, so the upload only works with
    // exactly the type we approved here.
    const signed = await client.sign(
      new Request(url, { method: "PUT", headers: { "Content-Type": data.contentType } }),
      { aws: { signQuery: true, allHeaders: true } },
    );

    return { uploadUrl: signed.url, publicUrl: `${publicUrl}/${key}` };
  });

const UrlsInput = z.object({ urls: z.array(z.string().url()).min(1).max(6) });

// Called after the browser has finished uploading and before the project is
// saved. Confirms each file really exists and is within the size limit.
export const confirmGalleryVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UrlsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertMiniAdminOrAdmin(supabase, userId);

    const { client, objectUrl, publicUrl } = await getR2();

    for (const url of data.urls) {
      const key = keyFromPublicUrl(url, publicUrl);
      if (!key) throw new Error("Unexpected video address.");

      const head = await client.fetch(objectUrl(key), { method: "HEAD" });
      if (!head.ok) throw new Error("A video did not finish uploading. Please try again.");

      const size = Number(head.headers.get("content-length") ?? 0);
      if (size > MAX_VIDEO_BYTES) {
        await client.fetch(objectUrl(key), { method: "DELETE" });
        throw new Error("A video is larger than 200 MB and was rejected.");
      }
    }

    return { ok: true };
  });

export const deleteGalleryVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UrlsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertMiniAdminOrAdmin(supabase, userId);

    const { client, objectUrl, publicUrl } = await getR2();

    let deleted = 0;
    for (const url of data.urls) {
      const key = keyFromPublicUrl(url, publicUrl);
      if (!key) continue;
      const res = await client.fetch(objectUrl(key), { method: "DELETE" });
      if (res.ok) deleted += 1;
      else console.error(`[R2] Could not delete ${key}: ${res.status}`);
    }

    return { deleted };
  });
