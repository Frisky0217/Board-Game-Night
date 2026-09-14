-- The Archive: an entry may carry a photograph and a written note.
--
-- Photos live in a Supabase Storage bucket; `photo_url` holds the path, not the
-- image. Both columns are nullable and the no-photo case is the common one.
--
-- Run this in the Supabase SQL editor.

alter table sessions
  add column if not exists photo_url text,
  add column if not exists description text;
