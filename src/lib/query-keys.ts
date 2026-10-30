/** Query-key factory. Invalidation rule: a mutation invalidates its domain root. */
export const qk = {
  me: ["me"] as const,
  org: {
    all: ["org"] as const,
    departments: () => ["org", "departments"] as const,
    positions: () => ["org", "positions"] as const,
    employees: (f?: unknown) => ["org", "employees", f ?? {}] as const,
    employee: (id: string) => ["org", "employee", id] as const,
    users: () => ["org", "users"] as const,
  },
  perf: {
    all: ["perf"] as const,
    cycles: () => ["perf", "cycles"] as const,
    cycle: (id: string) => ["perf", "cycle", id] as const,
    profiles: () => ["perf", "profiles"] as const,
    profile: (id: string) => ["perf", "profile", id] as const,
    assignments: (f?: unknown) => ["perf", "assignments", f ?? {}] as const,
    assignment: (id: string) => ["perf", "assignment", id] as const,
  },
  comp: {
    all: ["comp"] as const,
    library: () => ["comp", "library"] as const,
    competency: (id: string) => ["comp", "competency", id] as const,
    levels: () => ["comp", "levels"] as const,
    requirements: (p?: string) => ["comp", "requirements", p ?? "all"] as const,
    gaps: (f?: unknown) => ["comp", "gaps", f ?? {}] as const,
    assessments: (f?: unknown) => ["comp", "assessments", f ?? {}] as const,
  },
  shared: {
    all: ["shared"] as const,
    notifications: () => ["shared", "notifications"] as const,
    approvals: () => ["shared", "approvals"] as const,
    audit: (f?: unknown) => ["shared", "audit", f ?? {}] as const,
    settings: () => ["shared", "settings"] as const,
  },
};
