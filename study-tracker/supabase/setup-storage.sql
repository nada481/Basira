-- Run once in Supabase → SQL Editor if uploads still fail.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', true, 20971520)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

-- Public read for the documents bucket
create policy if not exists "Public read documents"
on storage.objects for select
using (bucket_id = 'documents');

-- Authenticated users can upload to their own folder
create policy if not exists "Users upload own documents"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and auth.role() = 'authenticated'
);
