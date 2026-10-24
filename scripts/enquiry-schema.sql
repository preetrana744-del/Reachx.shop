create table public.website_enquiries (
 id uuid primary key, created_at timestamptz not null default now(),
 name text not null check (char_length(btrim(name)) between 2 and 120),
 email text not null check (char_length(email) between 3 and 320),
 company text not null default '' check (char_length(company)<=160),
 message text not null check (char_length(btrim(message)) between 10 and 4000),
 source text not null check (source in ('homepage','contact')),
 page_path text not null check (char_length(page_path)<=180),
 abuse_key text not null check (char_length(abuse_key)=64),
 status text not null default 'new' check (status in ('new','contacted','qualified','closed','spam'))
);
alter table public.website_enquiries enable row level security;
revoke all on public.website_enquiries from public, anon, authenticated;
grant all on public.website_enquiries to service_role;
create index website_enquiries_abuse_time on public.website_enquiries(abuse_key,created_at);
comment on table public.website_enquiries is 'ReachX enquiries collected by the server endpoint. No public read or write access. Review new requests in Supabase Table Editor.';
create function public.capture_website_enquiry(p_id uuid,p_name text,p_email text,p_company text,p_message text,p_source text,p_path text,p_abuse_key text) returns uuid
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('reachx_enquiry_capture',0));
 if exists(select 1 from public.website_enquiries where id=p_id) then return p_id; end if;
 if (select count(*) from public.website_enquiries where abuse_key=p_abuse_key and created_at>now()-interval '10 minutes')>=3
 or (select count(*) from public.website_enquiries where created_at>now()-interval '1 hour')>=200 then
 raise exception 'submission_rate_limited' using errcode='P0001';
 end if;
 insert into public.website_enquiries(id,name,email,company,message,source,page_path,abuse_key)
 values(p_id,p_name,p_email,p_company,p_message,p_source,p_path,p_abuse_key);
 return p_id;
end $$;
revoke all on function public.capture_website_enquiry(uuid,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.capture_website_enquiry(uuid,text,text,text,text,text,text,text) to service_role;
