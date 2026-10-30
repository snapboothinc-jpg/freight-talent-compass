/**
 * Read layer: browser Supabase client with the user's session, so Row Level
 * Security scopes every row. Writes never go through here — they use server
 * functions in lib/api/actions.functions.ts.
 */
import { supabase } from "@/integrations/supabase/client";

function check<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export type Department = { id: string; code: string; name: string; parent_id: string | null; head_employee_id: string | null; status: string; version: number };
export type Position = { id: string; code: string; title: string; department_id: string; description: string | null; status: string; version: number };
export type EmployeeRow = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department_id: string;
  position_id: string;
  employment_status: string;
  hire_date: string | null;
  job_notes: string | null;
  user_id: string | null;
  version: number;
  department: { name: string } | null;
  position: { title: string } | null;
};

export const fetchDepartments = async () =>
  check(await supabase.from("departments").select("*").order("name")) as Department[];
export const fetchPositions = async () => check(await supabase.from("positions").select("*").order("title")) as Position[];

export const EMPLOYEE_SELECT =
  "*, department:departments!employees_department_id_fkey(name), position:positions!employees_position_id_fkey(title)";

export const fetchEmployees = async () =>
  check(await supabase.from("employees").select(EMPLOYEE_SELECT).order("last_name").limit(1000)) as unknown as EmployeeRow[];

export const fetchEmployee = async (id: string) => {
  const r = await supabase.from("employees").select(EMPLOYEE_SELECT).eq("id", id).maybeSingle();
  return check(r) as unknown as EmployeeRow | null;
};

export const fetchCurrentSupervisors = async () =>
  check(await supabase.from("reporting_relationships").select("employee_id, supervisor_id, effective_from").eq("is_current", true)) as {
    employee_id: string;
    supervisor_id: string;
    effective_from: string;
  }[];

export const empName = (e?: { first_name: string; last_name: string } | null) => (e ? `${e.first_name} ${e.last_name}` : "—");

export const fetchLevels = async () =>
  check(await supabase.from("proficiency_levels").select("*").order("level")) as {
    id: string;
    level: number;
    label: string;
    description: string;
    version: number;
  }[];

export const fetchCompetencies = async () =>
  check(await supabase.from("competencies").select("*, category:competency_categories(name)").order("name")) as unknown as {
    id: string;
    code: string;
    name: string;
    description: string | null;
    definition: string | null;
    category_id: string;
    status: string;
    is_mandatory: boolean;
    is_safety_critical: boolean;
    version: number;
    category: { name: string } | null;
  }[];

export const fetchCategories = async () =>
  check(await supabase.from("competency_categories").select("*").order("name")) as { id: string; name: string; description: string | null }[];

export const fetchRequirements = async (positionId?: string) => {
  let q = supabase
    .from("position_competency_requirements")
    .select("*, competency:competencies(name, code, status), position:positions(title)")
    .eq("is_current", true);
  if (positionId) q = q.eq("position_id", positionId);
  return check(await q) as unknown as {
    id: string;
    position_id: string;
    competency_id: string;
    required_level: number;
    is_mandatory: boolean;
    is_safety_critical: boolean;
    effective_from: string;
    competency: { name: string; code: string; status: string } | null;
    position: { title: string } | null;
  }[];
};

export type GapRow = {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_id: string;
  department_name: string;
  position_id: string;
  position_title: string;
  competency_id: string;
  competency_name: string;
  category_id: string;
  category_name: string;
  required_level: number;
  current_level: number | null;
  gap: number | null;
  gap_status: "not_assessed" | "met" | "gap";
  is_mandatory: boolean;
  is_safety_critical: boolean;
  assessment_id: string | null;
  assessment_date: string | null;
  evidence_summary: string | null;
};

export const fetchGaps = async (f: { employee?: string; department?: string; position?: string; category?: string; status?: string } = {}) =>
  check(
    await supabase.rpc("competency_gaps", {
      _employee: f.employee || undefined,
      _department: f.department || undefined,
      _position: f.position || undefined,
      _category: f.category || undefined,
      _status: f.status || undefined,
      _limit: 500,
      _offset: 0,
    }),
  ) as unknown as GapRow[];

export type AssignmentRow = {
  id: string;
  cycle_id: string;
  employee_id: string;
  evaluator_id: string;
  status: string;
  overall_score: number | null;
  submitted_at: string | null;
  approved_at: string | null;
  self_submitted_at: string | null;
  self_evaluation: boolean;
  created_at: string;
  version: number;
  profile_version_id: string;
  employee: { first_name: string; last_name: string; employee_code: string; department_id: string } | null;
  evaluator: { first_name: string; last_name: string } | null;
  cycle: { name: string; status: string; due_date: string | null } | null;
  profile_version: { version_number: number } | null;
};

export const ASSIGNMENT_SELECT =
  "id, cycle_id, employee_id, evaluator_id, status, overall_score, submitted_at, approved_at, self_submitted_at, self_evaluation, created_at, version, profile_version_id, employee:employees!evaluation_assignments_employee_id_fkey(first_name,last_name,employee_code,department_id), evaluator:employees!evaluation_assignments_evaluator_id_fkey(first_name,last_name), cycle:evaluation_cycles(name,status,due_date), profile_version:evaluation_profile_versions(version_number)";

export const fetchAssignments = async (f: { cycle?: string; employee?: string; evaluator?: string } = {}) => {
  let q = supabase.from("evaluation_assignments").select(ASSIGNMENT_SELECT).order("created_at", { ascending: false }).limit(1000);
  if (f.cycle) q = q.eq("cycle_id", f.cycle);
  if (f.employee) q = q.eq("employee_id", f.employee);
  if (f.evaluator) q = q.eq("evaluator_id", f.evaluator);
  return check(await q) as unknown as AssignmentRow[];
};

export const fetchCycles = async () =>
  check(await supabase.from("evaluation_cycles").select("*").order("period_start", { ascending: false })) as {
    id: string;
    name: string;
    description: string | null;
    period_start: string;
    period_end: string;
    due_date: string | null;
    self_evaluation: boolean;
    status: string;
    version: number;
  }[];

export type AssessmentRow = {
  id: string;
  employee_id: string;
  competency_id: string;
  assessor_id: string;
  assessment_date: string;
  current_level: number | null;
  evidence_summary: string | null;
  comments: string | null;
  is_reassessment: boolean;
  status: string;
  reviewer_id: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  version: number;
  created_at: string;
  employee: { first_name: string; last_name: string } | null;
  competency: { name: string; code: string } | null;
};

export const fetchAssessments = async (f: { employee?: string; competency?: string; status?: string; mine?: string } = {}) => {
  let q = supabase
    .from("competency_assessments")
    .select("*, employee:employees(first_name,last_name), competency:competencies(name,code)")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (f.employee) q = q.eq("employee_id", f.employee);
  if (f.competency) q = q.eq("competency_id", f.competency);
  if (f.status) q = q.eq("status", f.status);
  if (f.mine) q = q.eq("assessor_id", f.mine);
  return check(await q) as unknown as AssessmentRow[];
};

export { check };
