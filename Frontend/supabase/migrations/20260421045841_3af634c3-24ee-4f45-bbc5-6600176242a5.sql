insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;

create policy "public_read_product_images" on storage.objects for select using (bucket_id = 'product-images');
create policy "public_insert_product_images" on storage.objects for insert with check (bucket_id = 'product-images');
create policy "public_update_product_images" on storage.objects for update using (bucket_id = 'product-images');
create policy "public_delete_product_images" on storage.objects for delete using (bucket_id = 'product-images');