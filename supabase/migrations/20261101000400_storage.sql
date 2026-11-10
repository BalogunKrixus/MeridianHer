-- Private bucket for expert licence and ID uploads (PRD sections 7 and 13).
-- Files live under `<user id>/...`. Applicants manage their own folder; only
-- admins read across folders, through 5 minute signed URLs made server side.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('expert-documents', 'expert-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

create policy expert_documents_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'expert-documents' and (storage.foldername(name))[1] = auth.uid()::text and app.can_act());

create policy expert_documents_select on storage.objects for select to authenticated
  using (bucket_id = 'expert-documents' and ((storage.foldername(name))[1] = auth.uid()::text or app.is_admin()));

create policy expert_documents_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'expert-documents' and (storage.foldername(name))[1] = auth.uid()::text);
