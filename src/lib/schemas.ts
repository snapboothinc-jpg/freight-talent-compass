/** Shared Zod schemas: used by forms (client) and server functions (server). */
import { z } from "zod";

export const uuid = z.string().uuid();
const optText = (max: number) => z.string().max(max).optional().nullable();
const idem = { idempotencyKey: uuid };

export const departmentSchema = z
  .object({
    id: uuid.nullable(),
    code: z.string().trim().min(1).max(20),
    name: z.string().trim().min(2).max(120),
    parent_id: uuid.nullable(),
    head_employee_id: uuid.nullable(),
    status: z.enum(["active", "inactive"]),
    version: z.number().int().nullable(),
  })
  .strict();

export const positionSchema = z
  .object({
    id: uuid.nullable(),
    code: z.string().trim().min(1).max(20),
    title: z.string().trim().min(2).max(120),
    department_id: uuid,
    description: optText(2000),
    status: z.enum(["active", "inactive"]),
    version: z.number().int().nullable(),
  })
  .strict();

export const employeeFields = z
  .object({
    employee_code: z.string().trim().min(1).max(30),
    first_name: z.string().trim().min(1).max(80),
    last_name: z.string().trim().min(1).max(80),
    email: z.union([z.string().trim().email().max(200), z.literal("")]).optional(),
    phone: z.string().trim().max(40).optional(),
    department_id: uuid,
    position_id: uuid,
    employment_status: z.enum(["active", "on_leave", "inactive", "terminated"]),
    hire_date: z.string().max(10).optional(),
    job_notes: z.string().max(2000).optional(),
  })
  .strict();
export const employeeSchema = z.object({ id: uuid.nullable(), version: z.number().int().nullable(), data: employeeFields }).strict();

export const supervisorSchema = z
  .object({ employee_id: uuid, supervisor_id: uuid.nullable(), effective_from: z.string().max(10).nullable() })
  .strict();

export const createUserSchema = z
  .object({
    email: z.string().trim().email().max(200),
    full_name: z.string().trim().min(2).max(120),
    password: z
      .string()
      .min(12, "At least 12 characters")
      .max(72)
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    role: z.enum(["super_admin", "admin", "hr_admin", "dept_head", "supervisor", "employee", "ops_manager"]),
    employee_id: uuid.nullable(),
  })
  .strict();

export const cycleFields = z
  .object({
    name: z.string().trim().min(3).max(120),
    description: z.string().max(2000).optional(),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    due_date: z.string().max(10).optional(),
    self_evaluation: z.boolean(),
  })
  .strict()
  .refine((d) => d.period_end >= d.period_start, { message: "End must be on or after start", path: ["period_end"] });

export const itemTypes = ["rating", "short_text", "long_text", "single_choice", "multi_choice", "yes_no", "kpi"] as const;
export const ITEM_TYPE_LABELS: Record<(typeof itemTypes)[number], string> = {
  rating: "Numeric rating",
  short_text: "Short text",
  long_text: "Long text",
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  yes_no: "Yes / No",
  kpi: "KPI (target vs actual)",
};

export const profileItemSchema = z
  .object({
    label: z.string().trim().min(1).max(300),
    help_text: z.string().max(2000).optional(),
    item_type: z.enum(itemTypes),
    weight: z.coerce.number().min(0).max(100),
    options: z.array(z.string().max(120)).max(20),
    kpi_target: z.union([z.coerce.number(), z.literal("")]).optional().nullable(),
    kpi_unit: z.string().max(30).optional(),
    competency_id: z.union([uuid, z.literal("")]).optional().nullable(),
    evidence_required: z.boolean(),
    is_required: z.boolean(),
  })
  .strict()
  .refine((i) => ["rating", "kpi"].includes(i.item_type) || Number(i.weight) === 0, {
    message: "Only rating and KPI items carry weight",
    path: ["weight"],
  })
  .refine((i) => i.item_type !== "kpi" || (i.kpi_target !== "" && i.kpi_target != null), {
    message: "KPI items need a target",
    path: ["kpi_target"],
  });

export const profileContentSchema = z
  .object({
    rating_scale_max: z.coerce.number().int().min(3).max(10),
    instructions: z.string().max(4000).optional(),
    effective_date: z.string().max(10).optional(),
    sections: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(160),
            description: z.string().max(2000).optional(),
            items: z.array(profileItemSchema).max(60),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();

export const responseSchema = z
  .object({
    item_id: uuid,
    rating: z.number().min(1).max(10).nullable().optional(),
    text_value: z.string().max(8000).nullable().optional(),
    choice_values: z.array(z.string().max(120)).max(20).nullable().optional(),
    kpi_actual: z.number().nullable().optional(),
    comment: z.string().max(4000).nullable().optional(),
  })
  .strict();

export const saveEvaluationSchema = z
  .object({
    assignment_id: uuid,
    respondent: z.enum(["self", "evaluator"]),
    responses: z.array(responseSchema).max(200),
    overall_comment: z.string().max(8000).nullable(),
    version: z.number().int(),
  })
  .strict();

export const submitEvaluationSchema = z.object({ assignment_id: uuid, respondent: z.enum(["self", "evaluator"]), ...idem }).strict();
export const reviewEvaluationSchema = z
  .object({ assignment_id: uuid, decision: z.enum(["approve", "return"]), comments: z.string().max(4000), ...idem })
  .strict();
export const reopenEvaluationSchema = z.object({ assignment_id: uuid, reason: z.string().trim().min(5).max(2000), ...idem }).strict();
export const createAssignmentsSchema = z.object({ cycle_id: uuid, employee_ids: z.array(uuid).min(1).max(500), ...idem }).strict();

export const competencyFields = z
  .object({
    code: z.string().trim().min(1).max(20),
    name: z.string().trim().min(2).max(120),
    description: z.string().max(2000).optional(),
    definition: z.string().max(4000).optional(),
    category_id: uuid,
    status: z.enum(["draft", "active", "retired"]),
    is_mandatory: z.boolean(),
    is_safety_critical: z.boolean(),
    indicators: z.array(z.object({ level: z.number().int().min(1).max(5), indicator: z.string().trim().min(2).max(1000) }).strict()).max(50),
  })
  .strict();

export const requirementSchema = z
  .object({
    position_id: uuid,
    competency_id: uuid,
    required_level: z.number().int().min(1).max(5),
    is_mandatory: z.boolean(),
    is_safety_critical: z.boolean(),
    reason: z.string().max(1000).optional(),
    remove: z.boolean(),
  })
  .strict();

export const assessmentSchema = z
  .object({
    id: uuid.nullable(),
    employee_id: uuid,
    competency_id: uuid,
    current_level: z.number().int().min(1).max(5).nullable(),
    evidence_summary: z.string().max(4000).optional(),
    comments: z.string().max(4000).optional(),
    is_reassessment: z.boolean(),
    version: z.number().int().nullable(),
  })
  .strict();

export const reviewAssessmentSchema = z
  .object({ id: uuid, decision: z.enum(["approve", "reject"]), comments: z.string().max(4000), ...idem })
  .strict();

export const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
