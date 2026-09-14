/**
 * Constants shared by the browser (which uploads) and the server (which
 * validates and builds URLs). Deliberately free of any Supabase client import,
 * so pulling these into a Server Action does not drag the browser client into
 * the server bundle. The upload itself lives in `lib/photo-upload.ts`.
 */

export const PHOTO_BUCKET = "entry-photos";

export const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/heic,image/heif";

/** Matches what the uploader produces, and nothing else. */
export const PHOTO_PATH_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;
