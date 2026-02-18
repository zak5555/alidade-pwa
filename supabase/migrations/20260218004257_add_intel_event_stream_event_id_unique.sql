-- Keep local migrations in sync with production hotfix:
-- enforce unique event_id so edge ingest upsert onConflict(event_id) works.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'intel_event_stream_event_id_key'
      and conrelid = 'public.intel_event_stream'::regclass
  ) then
    alter table public.intel_event_stream
      add constraint intel_event_stream_event_id_key unique (event_id);
  end if;
end
$$;
