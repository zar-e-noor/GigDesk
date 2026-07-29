-- Create a storage bucket for signatures
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', true);

-- Allow public read access to signatures
create policy "Signatures are publicly viewable"
on storage.objects for select
to public
using ( bucket_id = 'signatures' );

-- Allow authenticated users to upload signatures
create policy "Authenticated users can upload signatures"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'signatures' );

-- Allow service role to delete signatures (for cleanup)
create policy "Service role can delete signatures"
on storage.objects for delete
to service_role
using ( bucket_id = 'signatures' );
