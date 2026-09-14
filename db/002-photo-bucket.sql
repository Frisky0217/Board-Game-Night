-- The Archive: a bucket for entry photographs.
--
-- Public, because the app has no accounts and everything else in it is already
-- readable by anyone with the link. The path is stored in sessions.photo_url;
-- the image itself never goes in the database.
--
-- Run this in the Supabase SQL editor.

-- The bucket. The size limit and MIME allow-list are cheap defence, since the
-- bucket accepts anonymous writes: the browser downscales to JPEG before
-- uploading, so anything much larger than this is not something we produced.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-photos',
  'entry-photos',
  true,
  5242880,                                        -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Policies. `create policy` has no `if not exists`, so drop first to stay
-- re-runnable.
drop policy if exists "entry photos are readable by anyone" on storage.objects;
drop policy if exists "anyone may add an entry photo" on storage.objects;

create policy "entry photos are readable by anyone"
  on storage.objects for select
  using (bucket_id = 'entry-photos');

create policy "anyone may add an entry photo"
  on storage.objects for insert
  with check (bucket_id = 'entry-photos');

-- Deliberately no update or delete policy: nothing in the app removes a
-- photograph, and withholding those means a passer-by cannot erase the
-- archive's pictures. A book does not un-paste its plates.
