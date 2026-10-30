-- Phase 5, stage 2: training & development, AI, and outbox tables with grants, RLS, policies, triggers.
create table public.development_plans (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  title text not null check (length(title) between 3 and 160),
  objectives text check (length(objectives) <= 4000),
  responsible_id uuid references public.employees(id) on delete set null,
  target_date date,
  status text not null default 'draft' check (status in ('draft','active','completed','cancelled')),
  notes text check (length(notes) <= 4000),
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.development_plans(employee_id, status);

create table public.development_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.development_plans(id) on delete cascade,
  item_type text not null check (item_type in ('course','learning_path','training','other')),
  title text not null check (length(title) between 3 and 200),
  description text check (length(description) <= 4000),
  competency_id uuid references public.competencies(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  learning_path_id uuid references public.learning_paths(id) on delete set null,
  training_session_id uuid,
  gap_snapshot_id uuid,
  ai_recommendation_id uuid,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  target_date date,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  completed_at timestamptz,
  evidence text check (length(evidence) <= 4000),
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.development_plan_items(plan_id);

create table public.trainers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 160),
  email text check (length(email) <= 200),
  specialty text check (length(specialty) <= 200),
  is_external boolean not null default false,
  status text not null default 'active' check (status in ('active','inactive')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 1 and 20),
  title text not null check (length(title) between 3 and 160),
  type text not null default 'workshop' check (type in ('workshop','seminar','on_the_job','e_learning','drill')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue text check (length(venue) <= 200),
  delivery_method text not null default 'in_person' check (delivery_method in ('in_person','virtual','hybrid')),
  trainer_id uuid references public.trainers(id) on delete set null,
  capacity int check (capacity between 1 and 10000),
  status text not null default 'planned' check (status in ('planned','in_progress','completed','cancelled')),
  related_competency_id uuid references public.competencies(id) on delete set null,
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid,
  check (ends_at > starts_at)
);
create index on public.training_sessions(starts_at);
create index on public.training_sessions(status);

create table public.training_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  development_plan_item_id uuid references public.development_plan_items(id) on delete set null,
  status text not null default 'registered' check (status in ('registered','attended','absent','excused')),
  unique (session_id, employee_id),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.training_participants(employee_id);

create table public.training_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  status text not null check (status in ('present','absent','late','excused')),
  remarks text check (length(remarks) <= 2000),
  recorded_by uuid default auth.uid(),
  recorded_at timestamptz not null default now(),
  unique (session_id, employee_id),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.training_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  score numeric(5,2) check (score between 0 and 100),
  outcome text not null check (outcome in ('passed','failed','completed','incomplete')),
  feedback text check (length(feedback) <= 4000),
  evidence text check (length(evidence) <= 4000),
  recorded_by uuid default auth.uid(),
  unique (session_id, employee_id),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.training_effectiveness_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  reviewer_id uuid references public.employees(id) on delete set null,
  summary text not null check (length(summary) between 3 and 4000),
  follow_up_required boolean not null default false,
  follow_up_notes text check (length(follow_up_notes) <= 4000),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.competency_reassessments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  competency_id uuid not null references public.competencies(id) on delete restrict,
  session_id uuid references public.training_sessions(id) on delete set null,
  assessment_id uuid not null references public.competency_assessments(id) on delete restrict,
  notes text check (length(notes) <= 2000),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  competency_id uuid not null references public.competencies(id) on delete restrict,
  required_level int not null check (required_level between 1 and 5),
  current_level int check (current_level between 1 and 5),
  gap int not null check (gap between 0 and 4),
  gap_snapshot_id uuid,
  recommendation_type text not null check (recommendation_type in ('course','learning_path','training')),
  resource_id uuid not null,
  rationale text not null check (length(rationale) between 3 and 4000),
  expected_outcome text check (length(expected_outcome) <= 4000),
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  status text not null default 'pending_review' check (status in ('pending_review','accepted','edited','rejected')),
  model text not null,
  generated_by uuid not null,
  sources jsonb not null default '[]'::jsonb,
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.ai_recommendations(status);
create index on public.ai_recommendations(employee_id);

create table public.ai_recommendation_reviews (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.ai_recommendations(id) on delete cascade,
  reviewer_id uuid not null,
  decision text not null check (decision in ('accept','edit','reject')),
  comments text check (length(comments) <= 4000),
  edited jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  employee_id uuid,
  model text not null,
  status text not null check (status in ('success','error','invalid')),
  error text,
  latency_ms int,
  created_at timestamptz not null default now()
);
create index on public.ai_generation_logs(created_at desc);

create table public.ai_integration_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'lovable' check (provider in ('lovable','gemini')),
  model text not null default 'openai/gpt-6-astra',
  last_status text check (last_status in ('ok','error')),
  last_error text,
  last_checked_at timestamptz,
  version int not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
insert into public.ai_integration_settings(provider, model) values ('lovable','openai/gpt-6-astra');

create table public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('notification','email','ai_call')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','dead')),
  attempts int not null default 0,
  last_error text,
  next_retry_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.outbox_events(status, next_retry_at) where status in ('pending','processing');

grant select on public.development_plans, public.development_plan_items,
  public.trainers, public.training_sessions, public.training_participants, public.training_attendance,
  public.training_results, public.training_effectiveness_reviews, public.competency_reassessments,
  public.ai_recommendations, public.ai_recommendation_reviews, public.ai_generation_logs,
  public.ai_integration_settings to authenticated;
grant all on public.development_plans, public.development_plan_items,
  public.trainers, public.training_sessions, public.training_participants, public.training_attendance,
  public.training_results, public.training_effectiveness_reviews, public.competency_reassessments,
  public.ai_recommendations, public.ai_recommendation_reviews, public.ai_generation_logs,
  public.ai_integration_settings, public.outbox_events to service_role;

do $$ declare t text; begin
  foreach t in array array['development_plans','development_plan_items','trainers','training_sessions',
    'training_participants','training_attendance','training_results','training_effectiveness_reviews',
    'competency_reassessments','ai_recommendations','ai_recommendation_reviews',
    'ai_integration_settings','outbox_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.tg_touch()', t);
  end loop;
  execute format('alter table public.%I enable row level security', 'ai_generation_logs');
  foreach t in array array['development_plans','development_plan_items','trainers','training_sessions','training_participants',
    'training_attendance','training_results','training_effectiveness_reviews','competency_reassessments',
    'ai_recommendations','ai_recommendation_reviews','ai_integration_settings'] loop
    execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.tg_audit()', t);
  end loop;
end $$;

create policy "plans scoped" on public.development_plans for select to authenticated
  using (public.can_view_development(employee_id));
create policy "plan items scoped" on public.development_plan_items for select to authenticated
  using (exists(select 1 from public.development_plans p where p.id=plan_id and public.can_view_development(p.employee_id)));
create policy "trainers visible" on public.trainers for select to authenticated
  using (status='active' or public.can_manage_training());
create policy "sessions scoped" on public.training_sessions for select to authenticated
  using (public.can_manage_training() or public.has_perm('hr.employees')
    or exists(select 1 from public.training_participants tp where tp.session_id=id and
      (tp.employee_id=public.my_employee_id() or public.is_supervisor_of(tp.employee_id) or public.is_dept_head_of(tp.employee_id))));
create policy "participants scoped" on public.training_participants for select to authenticated
  using (employee_id=public.my_employee_id() or public.can_manage_training() or public.has_perm('hr.employees')
    or public.is_supervisor_of(employee_id) or public.is_dept_head_of(employee_id));
create policy "attendance scoped" on public.training_attendance for select to authenticated
  using (employee_id=public.my_employee_id() or public.can_manage_training() or public.has_perm('hr.employees')
    or public.is_supervisor_of(employee_id) or public.is_dept_head_of(employee_id));
create policy "results scoped" on public.training_results for select to authenticated
  using (employee_id=public.my_employee_id() or public.can_manage_training() or public.has_perm('hr.employees')
    or public.is_supervisor_of(employee_id) or public.is_dept_head_of(employee_id));
create policy "effectiveness manage" on public.training_effectiveness_reviews for select to authenticated
  using (public.can_manage_training() or public.has_perm('hr.employees'));
create policy "reassessments scoped" on public.competency_reassessments for select to authenticated
  using (public.can_view_comp(employee_id));
create policy "ai recs scoped" on public.ai_recommendations for select to authenticated
  using (public.can_review_ai() or public.has_perm('ai.generate')
    or public.is_supervisor_of(employee_id) or public.is_dept_head_of(employee_id));
create policy "ai reviews scoped" on public.ai_recommendation_reviews for select to authenticated
  using (public.can_review_ai());
create policy "ai logs scoped" on public.ai_generation_logs for select to authenticated
  using (public.can_review_ai() or public.has_perm('admin.audit'));
create policy "ai settings scoped" on public.ai_integration_settings for select to authenticated
  using (public.has_perm('admin.settings') or public.can_review_ai());

create or replace function public._notify(_user uuid, _title text, _body text, _link text, _kind text default 'info') returns void
language plpgsql security definer set search_path=public as $$
begin
  if _user is not null then
    insert into public.notifications(user_id,title,body,link,kind) values (_user,_title,_body,_link,_kind);
    insert into public.outbox_events(kind,payload) values ('email', jsonb_build_object('user_id',_user,'title',_title,'body',_body,'link',_link));
  end if;
end $$;