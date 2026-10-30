
-- ============ COMPETENCY ============
create table public.competency_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 2 and 80),
  description text check (length(description) <= 1000),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.proficiency_levels (
  id uuid primary key default gen_random_uuid(),
  level int not null unique check (level between 1 and 5),
  label text not null check (length(label) between 2 and 60),
  description text not null check (length(description) <= 1000),
  requires_validation boolean not null default true,
  version int not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);

create table public.competencies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(code) between 1 and 20),
  name text not null check (length(name) between 2 and 120),
  description text check (length(description) <= 2000),
  definition text check (length(definition) <= 4000),
  category_id uuid not null references public.competency_categories(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  is_mandatory boolean not null default false,
  is_safety_critical boolean not null default false,
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.competencies(category_id);
create index on public.competencies(status);

create table public.behavioral_indicators (
  id uuid primary key default gen_random_uuid(),
  competency_id uuid not null references public.competencies(id) on delete cascade,
  level int not null check (level between 1 and 5),
  indicator text not null check (length(indicator) between 2 and 1000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.behavioral_indicators(competency_id, level);

create table public.position_competency_requirements (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.positions(id) on delete restrict,
  competency_id uuid not null references public.competencies(id) on delete restrict,
  required_level int not null check (required_level between 1 and 5),
  is_mandatory boolean not null default false,
  is_safety_critical boolean not null default false,
  effective_from date not null default current_date,
  effective_to date,
  is_current boolean not null default true,
  change_reason text check (length(change_reason) <= 1000),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid,
  check (effective_to is null or effective_to >= effective_from)
);
create unique index pcr_one_current on public.position_competency_requirements(position_id, competency_id) where is_current;
create index on public.position_competency_requirements(competency_id);

-- ============ PERFORMANCE ============
create table public.evaluation_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 3 and 120),
  description text check (length(description) <= 2000),
  period_start date not null,
  period_end date not null,
  due_date date,
  self_evaluation boolean not null default true,
  status text not null default 'draft' check (status in ('draft','open','closed')),
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid,
  check (period_end >= period_start)
);

create table public.evaluation_profiles (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.positions(id) on delete restrict,
  name text not null check (length(name) between 3 and 120),
  description text check (length(description) <= 2000),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.evaluation_profiles(position_id);

create table public.evaluation_profile_versions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.evaluation_profiles(id) on delete restrict,
  position_id uuid not null references public.positions(id) on delete restrict,
  version_number int not null check (version_number >= 1),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  effective_date date,
  rating_scale_max int not null default 5 check (rating_scale_max between 3 and 10),
  instructions text check (length(instructions) <= 4000),
  activated_at timestamptz, activated_by uuid,
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid,
  unique (profile_id, version_number)
);
create unique index epv_one_active_per_position on public.evaluation_profile_versions(position_id) where status='active';
create index on public.evaluation_profile_versions(profile_id);

create table public.evaluation_sections (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.evaluation_profile_versions(id) on delete cascade,
  title text not null check (length(title) between 1 and 160),
  description text check (length(description) <= 2000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.evaluation_sections(version_id);

create table public.evaluation_items (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.evaluation_profile_versions(id) on delete cascade,
  section_id uuid not null references public.evaluation_sections(id) on delete cascade,
  label text not null check (length(label) between 1 and 300),
  help_text text check (length(help_text) <= 2000),
  item_type text not null check (item_type in ('rating','short_text','long_text','single_choice','multi_choice','yes_no','kpi')),
  weight numeric(5,2) not null default 0 check (weight between 0 and 100),
  options jsonb not null default '[]'::jsonb,
  kpi_target numeric,
  kpi_unit text check (length(kpi_unit) <= 30),
  competency_id uuid references public.competencies(id) on delete restrict,
  evidence_required boolean not null default false,
  is_required boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid,
  check (item_type in ('rating','kpi') or weight = 0),
  check (item_type <> 'kpi' or kpi_target is not null)
);
create index on public.evaluation_items(version_id);
create index on public.evaluation_items(section_id);
create index on public.evaluation_items(competency_id);

create table public.evaluation_assignments (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.evaluation_cycles(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  evaluator_id uuid not null references public.employees(id) on delete restrict,
  profile_version_id uuid not null references public.evaluation_profile_versions(id) on delete restrict,
  snapshot jsonb not null,
  self_evaluation boolean not null default true,
  status text not null default 'not_started' check (status in ('not_started','in_progress','submitted','under_review','approved','reopened')),
  self_submitted_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  overall_score numeric(5,2) check (overall_score between 0 and 100),
  overall_comment text check (length(overall_comment) <= 8000),
  reopen_reason text check (length(reopen_reason) <= 2000),
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid,
  unique (cycle_id, employee_id),
  check (employee_id <> evaluator_id)
);
create index on public.evaluation_assignments(employee_id);
create index on public.evaluation_assignments(evaluator_id);
create index on public.evaluation_assignments(profile_version_id);
create index on public.evaluation_assignments(status);

create table public.evaluation_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.evaluation_assignments(id) on delete restrict,
  item_id uuid not null,
  respondent text not null check (respondent in ('self','evaluator')),
  rating numeric check (rating between 0 and 10),
  text_value text check (length(text_value) <= 8000),
  choice_values jsonb,
  kpi_actual numeric,
  comment text check (length(comment) <= 4000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid,
  unique (assignment_id, item_id, respondent)
);
create index on public.evaluation_responses(assignment_id);

create table public.evaluation_evidence (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.evaluation_assignments(id) on delete restrict,
  file_id uuid references public.file_metadata(id) on delete restrict,
  item_id uuid,
  note text check (length(note) <= 2000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid,
  check (file_id is not null or note is not null)
);
create index on public.evaluation_evidence(assignment_id);
create index on public.evaluation_evidence(file_id);

create table public.evaluation_reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.evaluation_assignments(id) on delete restrict,
  reviewer_id uuid not null default auth.uid(),
  decision text not null check (decision in ('approved','returned','reopened','comment')),
  comments text check (length(comments) <= 4000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.evaluation_reviews(assignment_id);

-- ============ ASSESSMENTS ============
create table public.competency_assessments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  competency_id uuid not null references public.competencies(id) on delete restrict,
  assessor_id uuid not null default auth.uid(),
  cycle_id uuid references public.evaluation_cycles(id) on delete restrict,
  assessment_date date not null default current_date,
  current_level int check (current_level between 1 and 5),
  evidence_summary text check (length(evidence_summary) <= 4000),
  comments text check (length(comments) <= 4000),
  is_reassessment boolean not null default false,
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected')),
  reviewer_id uuid,
  reviewed_at timestamptz,
  review_comments text check (length(review_comments) <= 4000),
  version int not null default 1,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create unique index ca_one_open on public.competency_assessments(employee_id, competency_id, coalesce(cycle_id,'00000000-0000-0000-0000-000000000000'::uuid)) where status in ('draft','submitted');
create index on public.competency_assessments(employee_id, competency_id, status);
create index on public.competency_assessments(competency_id);
create index on public.competency_assessments(cycle_id);

create table public.competency_assessment_evidence (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.competency_assessments(id) on delete restrict,
  file_id uuid references public.file_metadata(id) on delete restrict,
  note text check (length(note) <= 2000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid,
  check (file_id is not null or note is not null)
);
create index on public.competency_assessment_evidence(assessment_id);
create index on public.competency_assessment_evidence(file_id);

create table public.competency_gap_snapshots (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  competency_id uuid not null references public.competencies(id) on delete restrict,
  position_id uuid not null references public.positions(id) on delete restrict,
  required_level int not null,
  current_level int,
  gap int,
  gap_status text not null check (gap_status in ('not_assessed','met','gap')),
  is_mandatory boolean not null,
  is_safety_critical boolean not null,
  assessment_id uuid references public.competency_assessments(id) on delete restrict,
  snapshot_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(), updated_by uuid
);
create index on public.competency_gap_snapshots(employee_id, snapshot_at desc);
create index on public.competency_gap_snapshots(competency_id);

-- grants / RLS
grant select on public.competency_categories, public.proficiency_levels, public.competencies, public.behavioral_indicators,
  public.position_competency_requirements, public.evaluation_cycles, public.evaluation_profiles, public.evaluation_profile_versions,
  public.evaluation_sections, public.evaluation_items, public.evaluation_assignments, public.evaluation_responses,
  public.evaluation_evidence, public.evaluation_reviews, public.competency_assessments, public.competency_assessment_evidence,
  public.competency_gap_snapshots to authenticated;
grant all on public.competency_categories, public.proficiency_levels, public.competencies, public.behavioral_indicators,
  public.position_competency_requirements, public.evaluation_cycles, public.evaluation_profiles, public.evaluation_profile_versions,
  public.evaluation_sections, public.evaluation_items, public.evaluation_assignments, public.evaluation_responses,
  public.evaluation_evidence, public.evaluation_reviews, public.competency_assessments, public.competency_assessment_evidence,
  public.competency_gap_snapshots to service_role;

do $$ declare t text; begin
  foreach t in array array['competency_categories','proficiency_levels','competencies','behavioral_indicators','position_competency_requirements','evaluation_cycles','evaluation_profiles','evaluation_profile_versions','evaluation_sections','evaluation_items','evaluation_assignments','evaluation_responses','evaluation_evidence','evaluation_reviews','competency_assessments','competency_assessment_evidence','competency_gap_snapshots'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.tg_touch()', t);
  end loop;
  foreach t in array array['competency_categories','proficiency_levels','competencies','behavioral_indicators','position_competency_requirements','evaluation_cycles','evaluation_profiles','evaluation_profile_versions','evaluation_items','evaluation_assignments','evaluation_reviews','competency_assessments','competency_assessment_evidence','evaluation_evidence'] loop
    execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.tg_audit()', t);
  end loop;
end $$;

-- library / config readable by all signed-in users
create policy "read" on public.competency_categories for select to authenticated using (auth.uid() is not null);
create policy "read" on public.proficiency_levels for select to authenticated using (auth.uid() is not null);
create policy "read" on public.competencies for select to authenticated using (status='active' or public.has_perm('comp.manage'));
create policy "read" on public.behavioral_indicators for select to authenticated using (auth.uid() is not null);
create policy "read" on public.position_competency_requirements for select to authenticated using (auth.uid() is not null);
create policy "read" on public.evaluation_cycles for select to authenticated using (auth.uid() is not null);
create policy "read" on public.evaluation_profiles for select to authenticated using (public.has_perm('perf.manage') or public.has_perm('perf.evaluate'));
create policy "read" on public.evaluation_profile_versions for select to authenticated using (public.has_perm('perf.manage') or public.has_perm('perf.evaluate'));
create policy "read" on public.evaluation_sections for select to authenticated using (public.has_perm('perf.manage') or public.has_perm('perf.evaluate'));
create policy "read" on public.evaluation_items for select to authenticated using (public.has_perm('perf.manage') or public.has_perm('perf.evaluate'));
-- employee-scoped
create policy "scoped" on public.evaluation_assignments for select to authenticated
  using (public.can_view_perf(employee_id) or evaluator_id = public.my_employee_id());
create policy "scoped" on public.evaluation_responses for select to authenticated
  using (exists (select 1 from public.evaluation_assignments a where a.id=assignment_id and (public.can_view_perf(a.employee_id) or a.evaluator_id=public.my_employee_id())));
create policy "scoped" on public.evaluation_evidence for select to authenticated
  using (exists (select 1 from public.evaluation_assignments a where a.id=assignment_id and (public.can_view_perf(a.employee_id) or a.evaluator_id=public.my_employee_id())));
create policy "scoped" on public.evaluation_reviews for select to authenticated
  using (exists (select 1 from public.evaluation_assignments a where a.id=assignment_id and (public.can_view_perf(a.employee_id) or a.evaluator_id=public.my_employee_id())));
create policy "scoped" on public.competency_assessments for select to authenticated
  using (public.can_view_comp(employee_id) or assessor_id = auth.uid());
create policy "scoped" on public.competency_assessment_evidence for select to authenticated
  using (exists (select 1 from public.competency_assessments a where a.id=assessment_id and (public.can_view_comp(a.employee_id) or a.assessor_id=auth.uid())));
create policy "scoped" on public.competency_gap_snapshots for select to authenticated using (public.can_view_comp(employee_id));

-- immutability of non-draft profile content
create or replace function public.tg_profile_content_locked() returns trigger language plpgsql set search_path=public as $$
declare st text;
begin
  select status into st from public.evaluation_profile_versions where id = coalesce(new.version_id, old.version_id);
  if st is not null and st <> 'draft' then
    raise exception 'RULE: only draft profile versions can be edited; create a new version instead';
  end if;
  return coalesce(new, old);
end $$;
create trigger lock_sections before insert or update or delete on public.evaluation_sections for each row execute function public.tg_profile_content_locked();
create trigger lock_items before insert or update or delete on public.evaluation_items for each row execute function public.tg_profile_content_locked();

-- snapshot is immutable once created
create or replace function public.tg_snapshot_immutable() returns trigger language plpgsql as $$
begin
  if new.snapshot is distinct from old.snapshot or new.profile_version_id is distinct from old.profile_version_id then
    raise exception 'RULE: the evaluation profile snapshot cannot be changed';
  end if;
  return new;
end $$;
create trigger snapshot_immutable before update on public.evaluation_assignments for each row execute function public.tg_snapshot_immutable();

insert into public.proficiency_levels(level,label,description) values
 (1,'Awareness','Default - requires organizational validation. Basic awareness; needs close guidance.'),
 (2,'Developing','Default - requires organizational validation. Applies with support in routine situations.'),
 (3,'Proficient','Default - requires organizational validation. Applies independently in most situations.'),
 (4,'Advanced','Default - requires organizational validation. Handles complex situations and guides others.'),
 (5,'Expert','Default - requires organizational validation. Recognised authority; shapes practice.');
