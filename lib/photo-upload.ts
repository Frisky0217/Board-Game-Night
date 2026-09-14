import { PHOTO_BUCKET } from "@/lib/photo";
import { supabaseBrowser } from "@/lib/supabase-browser";

/** Long edge, in pixels, of what we keep. The plate is far smaller than this. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

/** At or under this, upload untouched — re-encoding would only cost quality. */
const SKIP_RESIZE_BELOW_BYTES = 400_000;

/**
 * Decode a file to a bitmap with its EXIF rotation already applied.
 *
 * `imageOrientation: "from-image"` is the load-bearing option: a phone photo
 * carries its rotation as metadata, and drawing raw pixels to a canvas without
 * honouring it produces a sideways picture. Returns null when the browser
 * cannot decode the format — HEIC from an iPhone is the case that matters,
 * and Chrome and Firefox cannot read it.
 */
async function decode(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }
}

function targetSize(width: number, height: number) {
  const longest = Math.max(width, height);
  if (longest <= MAX_EDGE) return { width, height };
  const scale = MAX_EDGE / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Shrink a photograph for the page. Returns the original untouched if it is
 * already small, or if the browser cannot decode it — an undecodable HEIC
 * should still reach the archive, just at its original size.
 */
async function downscale(
  file: File,
): Promise<{ blob: Blob; extension: string }> {
  const original = {
    blob: file as Blob,
    extension:
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg",
  };

  if (file.size <= SKIP_RESIZE_BELOW_BYTES) return original;

  const bitmap = await decode(file);
  if (!bitmap) return original;

  try {
    const { width, height } = targetSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return original;
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return original;

    // A re-encode can come out larger; keep whichever is smaller.
    if (blob.size >= file.size) return original;
    return { blob, extension: "jpg" };
  } finally {
    // Free the pixels rather than waiting for GC — a 12-megapixel photo is
    // roughly 48MB of bitmap on a phone.
    bitmap.close();
  }
}

/**
 * Put a photograph in the bucket and return its object path.
 *
 * A flat opaque name: the game is not known when the file is chosen on
 * /sessions/new and can be changed afterwards, so there is nothing stable to
 * group by, and nothing browses the bucket by path.
 */
export async function uploadPhoto(file: File): Promise<string> {
  const { blob, extension } = await downscale(file);
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabaseBrowser.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, {
      contentType: blob.type || file.type || "image/jpeg",
      cacheControl: "31536000", // immutable: a fresh uuid every time
      upsert: false,
    });

  if (error) throw new Error(error.message);
  return path;
}
