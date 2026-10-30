/**
 * Central permission policy (client mirror).
 * The authoritative copy lives in the database: public.role_permissions + the
 * SECURITY DEFINER scope helpers (has_perm, can_view_employee, can_view_perf,
 * can_view_comp). The UI reads permissions from my_context() — this file only
 * maps permissions to navigation and labels. Never use it as a security check.
 */
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  ClipboardCheck,
  CalendarRange,
  FileStack,
  Grid3x3,
  BookOpen,
  Target,
  TrendingDown,
  History,
  Inbox,
  Bell,
  ShieldCheck,
  ScrollText,
  Settings,
  UserCheck,
  ListChecks,
  BarChart3,
} from "lucide-react";

export type AppRole =
  | "super_admin"
  | "admin"
  | "hr_admin"
  | "dept_head"
  | "supervisor"
  | "employee"
  | "ops_manager";

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  hr_admin: "HR Administrator",
  dept_head: "Department Head",
  supervisor: "Supervisor",
  employee: "Employee",
  ops_manager: "Operations Manager (T&D)",
};

export type Permission =
  | "admin.users"
  | "admin.audit"
  | "admin.settings"
  | "admin.org"
  | "admin.roles"
  | "employees.view_all"
  | "hr.employees"
  | "perf.manage"
  | "perf.approve"
  | "perf.evaluate"
  | "comp.manage"
  | "comp.approve"
  | "comp.assess"
  | "comp.view_all"
  | "team.view"
  | "reports.hr"
  | "self.service"
  | "learn.manage"
  | "learn.approve"
  | "train.manage"
  | "ai.generate"
  | "ai.review"
  | "succession.manage"
  | "succession.dept"
  | "recognition.review";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** any of these permissions shows the item; empty = everyone signed in */
  anyOf: Permission[];
  /** hide for these roles (e.g. self pages for admins without employee record) */
  needsEmployee?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, anyOf: [] },
      { to: "/approvals", label: "Approval center", icon: Inbox, anyOf: ["perf.approve", "comp.approve"] },
      { to: "/notifications", label: "Notifications", icon: Bell, anyOf: [] },
    ],
  },
  {
    label: "Performance",
    items: [
      { to: "/performance", label: "Performance dashboard", icon: BarChart3, anyOf: ["perf.manage", "perf.evaluate"] },
      { to: "/performance/my", label: "My evaluations", icon: ClipboardCheck, anyOf: [], needsEmployee: true },
      { to: "/performance/team", label: "Team evaluations", icon: UserCheck, anyOf: ["perf.evaluate"] },
      { to: "/performance/cycles", label: "Evaluation cycles", icon: CalendarRange, anyOf: ["perf.manage"] },
      { to: "/performance/profiles", label: "Evaluation profiles", icon: FileStack, anyOf: ["perf.manage"] },
      { to: "/performance/matrix", label: "Position matrix", icon: Grid3x3, anyOf: ["perf.manage"] },
      { to: "/performance/history", label: "Evaluation history", icon: History, anyOf: ["perf.manage", "perf.evaluate"] },
    ],
  },
  {
    label: "Competency",
    items: [
      { to: "/competency", label: "Competency dashboard", icon: Target, anyOf: ["comp.manage", "comp.assess", "comp.view_all"] },
      { to: "/competency/library", label: "Competency library", icon: BookOpen, anyOf: [] },
      { to: "/competency/requirements", label: "Job requirements", icon: ListChecks, anyOf: ["comp.manage", "comp.view_all"] },
      { to: "/competency/matrix", label: "Employee matrix", icon: Grid3x3, anyOf: ["comp.manage", "comp.assess", "comp.view_all"] },
      { to: "/competency/gaps", label: "Gap analysis", icon: TrendingDown, anyOf: [] },
      { to: "/competency/history", label: "Assessment history", icon: History, anyOf: [] },
    ],
  },
  {
    label: "People & organization",
    items: [
      { to: "/people/employees", label: "Employees", icon: Users, anyOf: ["employees.view_all", "admin.org", "team.view"] },
      { to: "/org/departments", label: "Departments", icon: Building2, anyOf: ["admin.org", "hr.employees"] },
      { to: "/org/positions", label: "Positions", icon: Briefcase, anyOf: ["admin.org", "hr.employees"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin/users", label: "Users & roles", icon: ShieldCheck, anyOf: ["admin.users"] },
      { to: "/admin/audit", label: "Audit log", icon: ScrollText, anyOf: ["admin.audit"] },
      { to: "/admin/settings", label: "Settings", icon: Settings, anyOf: ["admin.settings", "comp.manage", "perf.manage"] },
    ],
  },
];

export function canSee(item: NavItem, perms: Set<string>, hasEmployee: boolean) {
  if (item.needsEmployee && !hasEmployee) return false;
  return item.anyOf.length === 0 || item.anyOf.some((p) => perms.has(p));
}

/** Status machines (mirror of public.status_transitions — the DB is authoritative). */
export const EVALUATION_TRANSITIONS: Record<string, string[]> = {
  not_started: ["in_progress", "submitted"],
  in_progress: ["in_progress", "submitted"],
  reopened: ["in_progress", "submitted"],
  submitted: ["under_review", "approved", "reopened"],
  under_review: ["approved", "reopened"],
  approved: ["reopened"],
};

export const ASSESSMENT_TRANSITIONS: Record<string, string[]> = {
  draft: ["draft", "submitted"],
  submitted: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

export function canTransition(map: Record<string, string[]>, from: string, to: string) {
  return (map[from] ?? []).includes(to);
}
