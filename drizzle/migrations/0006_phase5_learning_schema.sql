-- Phase 5, stage 1: learning management schema, permissions, settings, scope helpers, RLS.
insert into public.role_permissions(role, permission) values
 ('ops_manager','learn.manage'),('ops_manager','train.manage'),('ops_manager','ai.generate'),('ops_manager','ai.review'),
 ('hr_admin','learn.manage'),('hr_admin','learn.approve'),('hr_admin','train.manage'),('hr_admin','ai.generate'),('hr_admin','ai.review'),
 ('supervisor','ai.generate'),('dept_head','ai.generate');

insert into public.status_transitions(entity, from_status, to_status) values
 ('course','draft','pending_review'),('course','pending_review','approved'),('course','pending_review','draft'),
 ('course','approved','archived'),('course','draft','archived'),
 ('ai_recommendation','pending_review','accepted'),('ai_recommendation','pending_review','edited'),('ai_recommendation','pending_review','rejected'),
 ('development_plan','draft','active'),('development_plan','active','completed'),('development_plan','active','cancelled'),('development_plan','draft','cancelled'),
 ('plan_item','pending','in_progress'),('plan_item','in_progress','completed'),('plan_item','pending','cancelled'),('plan_item','in_progress','cancelled'),
 ('training_session','planned','in_progress'),('training_session','planned','cancelled'),('training_session','in_progress','completed'),('training_session','in_progress','cancelled');

alter table public.approval_tasks drop constraint approval_tasks_workflow_type_check;
alter table public.approval_tasks add constraint approval_tasks_workflow_type_check
  check (workflow_type in ('evaluation','competency_assessment','course_publication','ai_recommendation','recognition_nomination'));

insert into public.system_settings(key, value, description) values
 ('learning.publication_route', '"ops_submits_hr_approves"', 'Default - requires organizational validation. Operations Manager submits courses; HR Administrator approves publication.'),
 ('learning.quiz_max_attempts_default', '3', 'Default - requires organizational validation. Default maximum quiz attempts.'),
 ('ai.provider', '"lovable"', 'Default - requires organizational validation. AI provider: lovable (Lovable AI gateway) or gemini (own Gemini API key).'),
 ('ai.model', '"openai/gpt-6-astra"', 'Default - requires organizational validation. Model used for development recommendations.'),
 ('ai.max_items_per_run', '10', 'Default - requires organizational validation. Maximum recommendations per generation run.'),
 ('training.attendance_recorders', '"ops_manager_or_hr"', 'Default - requires organizational validation. Who may record attendance.');

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 1 and 20),
  title text not null check (length(title) between 3 and 160),
  description text check (length(description) <= 4000),
  category text check (length(category) <= 80),
  objectives text check (length(objectives) <= 4000),
  owner_id uuid references public.employees(id) on delete set null,
  duration_minutes int check (duration_minutes between 1 and 100000),
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')),
  status text not null default 'draft' check (status in ('draft','pending_review','approved','archived')),
  enrollment_open boolean not null default true,
  completion_rule text not null default 'all_lessons' check (completion_rule in ('all_lessons','quiz_pass','all_lessons_and_quiz')),
  reviewed_by uuid, reviewed_at timestamptz, review_comments text,
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.courses(status);

create table public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (length(title) between 1 and 160),
  description text check (length(description) <= 2000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.course_sections(course_id, sort_order);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.course_sections(id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  content text check (length(content) <= 20000),
  duration_minutes int check (duration_minutes between 1 and 10000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.lessons(section_id, sort_order);

create table public.learning_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  file_id uuid references public.file_metadata(id) on delete set null,
  label text not null check (length(label) between 1 and 200),
  url text check (length(url) <= 1000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.learning_materials(course_id);

create table public.course_competency_mappings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  competency_id uuid not null references public.competencies(id) on delete cascade,
  target_level int not null check (target_level between 1 and 5),
  unique (course_id, competency_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.course_competency_mappings(competency_id);

create table public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 160),
  description text check (length(description) <= 4000),
  competency_id uuid references public.competencies(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.learning_path_courses (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  sort_order int not null default 0,
  unique (path_id, course_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  source text not null default 'direct' check (source in ('direct','development_plan','learning_path')),
  development_plan_item_id uuid,
  status text not null default 'assigned' check (status in ('assigned','in_progress','completed')),
  assigned_by uuid default auth.uid(),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (course_id, employee_id),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.course_enrollments(employee_id, status);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.course_enrollments(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  unique (enrollment_id, lesson_id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (length(title) between 3 and 160),
  pass_score int not null default 70 check (pass_score between 1 and 100),
  max_attempts int not null default 3 check (max_attempts between 1 and 20),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.quizzes(course_id);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null check (length(question) between 3 and 2000),
  options jsonb not null,
  correct_index int not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.quiz_questions(quiz_id, sort_order);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete restrict,
  enrollment_id uuid not null references public.course_enrollments(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  attempt_no int not null,
  answers jsonb not null,
  score int not null check (score between 0 and 100),
  passed boolean not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  unique (quiz_id, employee_id, attempt_no),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.quiz_attempts(employee_id);

create table public.course_completions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  enrollment_id uuid not null references public.course_enrollments(id) on delete restrict,
  score int,
  completed_at timestamptz not null default now(),
  unique (course_id, employee_id),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create or replace function public.can_manage_learning() returns boolean
language sql stable security definer set search_path=public as $$
  select public.has_perm('learn.manage') or public.has_perm('learn.approve')
$$;

create or replace function public.can_manage_training() returns boolean
language sql stable security definer set search_path=public as $$
  select public.has_perm('train.manage')
$$;

create or replace function public.can_review_ai() returns boolean
language sql stable security definer set search_path=public as $$
  select public.has_perm('ai.review')
$$;

create or replace function public.can_view_development(_emp uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select _emp = public.my_employee_id()
    or public.is_supervisor_of(_emp) or public.is_dept_head_of(_emp)
    or public.has_perm('hr.employees') or public.has_perm('train.manage') or public.has_perm('learn.manage')
$$;

create or replace function public.course_visible(_course uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.courses c where c.id=_course and (c.status='approved' or public.can_manage_learning()))
$$;

grant select on public.courses, public.course_sections, public.lessons, public.learning_materials,
  public.course_competency_mappings, public.learning_paths, public.learning_path_courses,
  public.course_enrollments, public.lesson_progress, public.quizzes, public.quiz_questions,
  public.quiz_attempts, public.course_completions to authenticated;
grant all on public.courses, public.course_sections, public.lessons, public.learning_materials,
  public.course_competency_mappings, public.learning_paths, public.learning_path_courses,
  public.course_enrollments, public.lesson_progress, public.quizzes, public.quiz_questions,
  public.quiz_attempts, public.course_completions to service_role;

do $$ declare t text; begin
  foreach t in array array['courses','course_sections','lessons','learning_materials','course_competency_mappings',
    'learning_paths','learning_path_courses','course_enrollments','lesson_progress','quizzes','quiz_questions',
    'quiz_attempts','course_completions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.tg_touch()', t);
  end loop;
  foreach t in array array['courses','learning_paths','course_enrollments','quizzes','quiz_attempts','course_completions'] loop
    execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.tg_audit()', t);
  end loop;
end $$;

create policy "courses visible" on public.courses for select to authenticated
  using (status='approved' or public.can_manage_learning());
create policy "sections via course" on public.course_sections for select to authenticated
  using (public.course_visible(course_id));
create policy "lessons via course" on public.lessons for select to authenticated
  using (exists(select 1 from public.course_sections s where s.id=section_id and public.course_visible(s.course_id)));
create policy "materials via course" on public.learning_materials for select to authenticated
  using (public.course_visible(course_id));
create policy "mappings via course" on public.course_competency_mappings for select to authenticated
  using (public.course_visible(course_id));
create policy "paths visible" on public.learning_paths for select to authenticated
  using (status='active' or public.can_manage_learning());
create policy "path courses via path" on public.learning_path_courses for select to authenticated
  using (exists(select 1 from public.learning_paths p where p.id=path_id and (p.status='active' or public.can_manage_learning())));
create policy "enrollments scoped" on public.course_enrollments for select to authenticated
  using (employee_id=public.my_employee_id() or public.can_manage_learning() or public.can_manage_training()
    or public.is_supervisor_of(employee_id) or public.is_dept_head_of(employee_id));
create policy "lesson progress scoped" on public.lesson_progress for select to authenticated
  using (exists(select 1 from public.course_enrollments e where e.id=enrollment_id and
    (e.employee_id=public.my_employee_id() or public.can_manage_learning() or public.can_manage_training()
     or public.is_supervisor_of(e.employee_id) or public.is_dept_head_of(e.employee_id))));
create policy "quizzes via course" on public.quizzes for select to authenticated
  using (public.course_visible(course_id));
create policy "questions manage only" on public.quiz_questions for select to authenticated
  using (public.can_manage_learning());
create policy "attempts scoped" on public.quiz_attempts for select to authenticated
  using (employee_id=public.my_employee_id() or public.can_manage_learning() or public.can_manage_training());
create policy "completions scoped" on public.course_completions for select to authenticated
  using (employee_id=public.my_employee_id() or public.can_manage_learning() or public.can_manage_training()
    or public.is_supervisor_of(employee_id) or public.is_dept_head_of(employee_id));