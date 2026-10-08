// Shared helpers for gallery media (photos and videos). Safe to import on the
// client and the server.

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB

export const VIDEO_EXT_BY_TYPE = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
} as const;

export type VideoContentType = keyof typeof VIDEO_EXT_BY_TYPE;

const VIDEO_URL = /\.(mp4|webm|mov)(?:[?#].*)?$/i;

export const isVideoUrl = (url: string) => VIDEO_URL.test(url);

const EXT_TO_TYPE: Record<string, VideoContentType> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

// Some browsers report an empty type for .mov files, so fall back to the extension.
export function videoContentType(file: { type: string; name: string }): VideoContentType | null {
  if (file.type in VIDEO_EXT_BY_TYPE) return file.type as VideoContentType;
  if (file.type && !file.type.startsWith("video/")) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_TYPE[ext] ?? null;
}
