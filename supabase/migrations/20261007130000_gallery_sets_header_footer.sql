alter table public.gallery_sets
  add column if not exists title text not null default '',
  add column if not exists subtitle text not null default '',
  add column if not exists before_heading text not null default '',
  add column if not exists after_heading text not null default '',
  add column if not exists footer_tags text[] not null default '{}';

alter table public.gallery_sets
  drop constraint if exists gallery_sets_footer_tags_count;
alter table public.gallery_sets
  add constraint gallery_sets_footer_tags_count check (cardinality(footer_tags) <= 3);
