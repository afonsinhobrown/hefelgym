-- CRIAR BUCKET DE STORAGE PARA FATURAS
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

-- POLÍTICA DE SEGURANÇA (Quem pode subir ficheiros?)
-- Permitir upload para qualquer utilizador autenticado
create policy "Permitir Upload Faturas" 
on storage.objects for insert 
to authenticated 
with check ( bucket_id = 'invoices' );

-- Permitir leitura pública (para o cliente baixar via link)
create policy "Permitir Leitura Pública Faturas" 
on storage.objects for select 
to public 
using ( bucket_id = 'invoices' );
