export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      approval_tasks: {
        Row: {
          assignee_role: Database["public"]["Enums"]["app_role"] | null
          assignee_user: string | null
          comments: string | null
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          employee_id: string | null
          id: string
          record_id: string
          record_label: string
          status: string
          submitted_by: string | null
          updated_at: string
          updated_by: string | null
          workflow_type: string
        }
        Insert: {
          assignee_role?: Database["public"]["Enums"]["app_role"] | null
          assignee_user?: string | null
          comments?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          employee_id?: string | null
          id?: string
          record_id: string
          record_label: string
          status?: string
          submitted_by?: string | null
          updated_at?: string
          updated_by?: string | null
          workflow_type: string
        }
        Update: {
          assignee_role?: Database["public"]["Enums"]["app_role"] | null
          assignee_user?: string | null
          comments?: string | null
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          employee_id?: string | null
          id?: string
          record_id?: string
          record_label?: string
          status?: string
          submitted_by?: string | null
          updated_at?: string
          updated_by?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      behavioral_indicators: {
        Row: {
          competency_id: string
          created_at: string
          created_by: string | null
          id: string
          indicator: string
          level: number
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          competency_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          indicator: string
          level: number
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          competency_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          indicator?: string
          level?: number
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_indicators_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          category_id: string
          code: string
          created_at: string
          created_by: string | null
          definition: string | null
          description: string | null
          id: string
          is_demo: boolean
          is_mandatory: boolean
          is_safety_critical: boolean
          name: string
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          category_id: string
          code: string
          created_at?: string
          created_by?: string | null
          definition?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          is_mandatory?: boolean
          is_safety_critical?: boolean
          name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          category_id?: string
          code?: string
          created_at?: string
          created_by?: string | null
          definition?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          is_mandatory?: boolean
          is_safety_critical?: boolean
          name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "competencies_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "competency_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_assessment_evidence: {
        Row: {
          assessment_id: string
          created_at: string
          created_by: string | null
          file_id: string | null
          id: string
          note: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          created_by?: string | null
          file_id?: string | null
          id?: string
          note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          created_by?: string | null
          file_id?: string | null
          id?: string
          note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competency_assessment_evidence_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "competency_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_assessment_evidence_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_assessments: {
        Row: {
          assessment_date: string
          assessor_id: string
          comments: string | null
          competency_id: string
          created_at: string
          created_by: string | null
          current_level: number | null
          cycle_id: string | null
          employee_id: string
          evidence_summary: string | null
          id: string
          is_demo: boolean
          is_reassessment: boolean
          review_comments: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          assessment_date?: string
          assessor_id?: string
          comments?: string | null
          competency_id: string
          created_at?: string
          created_by?: string | null
          current_level?: number | null
          cycle_id?: string | null
          employee_id: string
          evidence_summary?: string | null
          id?: string
          is_demo?: boolean
          is_reassessment?: boolean
          review_comments?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          assessment_date?: string
          assessor_id?: string
          comments?: string | null
          competency_id?: string
          created_at?: string
          created_by?: string | null
          current_level?: number | null
          cycle_id?: string | null
          employee_id?: string
          evidence_summary?: string | null
          id?: string
          is_demo?: boolean
          is_reassessment?: boolean
          review_comments?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "competency_assessments_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_assessments_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "evaluation_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_assessments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_demo: boolean
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      competency_gap_snapshots: {
        Row: {
          assessment_id: string | null
          competency_id: string
          created_at: string
          created_by: string | null
          current_level: number | null
          employee_id: string
          gap: number | null
          gap_status: string
          id: string
          is_mandatory: boolean
          is_safety_critical: boolean
          position_id: string
          required_level: number
          snapshot_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assessment_id?: string | null
          competency_id: string
          created_at?: string
          created_by?: string | null
          current_level?: number | null
          employee_id: string
          gap?: number | null
          gap_status: string
          id?: string
          is_mandatory: boolean
          is_safety_critical: boolean
          position_id: string
          required_level: number
          snapshot_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assessment_id?: string | null
          competency_id?: string
          created_at?: string
          created_by?: string | null
          current_level?: number | null
          employee_id?: string
          gap?: number | null
          gap_status?: string
          id?: string
          is_mandatory?: boolean
          is_safety_critical?: boolean
          position_id?: string
          required_level?: number
          snapshot_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competency_gap_snapshots_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "competency_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_gap_snapshots_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_gap_snapshots_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competency_gap_snapshots_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          head_employee_id: string | null
          id: string
          is_demo: boolean
          name: string
          parent_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          head_employee_id?: string | null
          id?: string
          is_demo?: boolean
          name: string
          parent_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          head_employee_id?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          parent_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_fk"
            columns: ["head_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          email: string | null
          employee_code: string
          employment_status: string
          first_name: string
          hire_date: string | null
          id: string
          is_demo: boolean
          job_notes: string | null
          last_name: string
          phone: string | null
          position_id: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          email?: string | null
          employee_code: string
          employment_status?: string
          first_name: string
          hire_date?: string | null
          id?: string
          is_demo?: boolean
          job_notes?: string | null
          last_name: string
          phone?: string | null
          position_id: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          email?: string | null
          employee_code?: string
          employment_status?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          is_demo?: boolean
          job_notes?: string | null
          last_name?: string
          phone?: string | null
          position_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_assignments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          cycle_id: string
          employee_id: string
          evaluator_id: string
          id: string
          is_demo: boolean
          overall_comment: string | null
          overall_score: number | null
          profile_version_id: string
          reopen_reason: string | null
          self_evaluation: boolean
          self_submitted_at: string | null
          snapshot: Json
          status: string
          submitted_at: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          cycle_id: string
          employee_id: string
          evaluator_id: string
          id?: string
          is_demo?: boolean
          overall_comment?: string | null
          overall_score?: number | null
          profile_version_id: string
          reopen_reason?: string | null
          self_evaluation?: boolean
          self_submitted_at?: string | null
          snapshot: Json
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          cycle_id?: string
          employee_id?: string
          evaluator_id?: string
          id?: string
          is_demo?: boolean
          overall_comment?: string | null
          overall_score?: number | null
          profile_version_id?: string
          reopen_reason?: string | null
          self_evaluation?: boolean
          self_submitted_at?: string | null
          snapshot?: Json
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_assignments_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "evaluation_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_assignments_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_assignments_profile_version_id_fkey"
            columns: ["profile_version_id"]
            isOneToOne: false
            referencedRelation: "evaluation_profile_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_cycles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_demo: boolean
          name: string
          period_end: string
          period_start: string
          self_evaluation: boolean
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_demo?: boolean
          name: string
          period_end: string
          period_start: string
          self_evaluation?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          period_end?: string
          period_start?: string
          self_evaluation?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      evaluation_evidence: {
        Row: {
          assignment_id: string
          created_at: string
          created_by: string | null
          file_id: string | null
          id: string
          item_id: string | null
          note: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          created_by?: string | null
          file_id?: string | null
          id?: string
          item_id?: string | null
          note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          created_by?: string | null
          file_id?: string | null
          id?: string
          item_id?: string | null
          note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_evidence_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "evaluation_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_evidence_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_items: {
        Row: {
          competency_id: string | null
          created_at: string
          created_by: string | null
          evidence_required: boolean
          help_text: string | null
          id: string
          is_required: boolean
          item_type: string
          kpi_target: number | null
          kpi_unit: string | null
          label: string
          options: Json
          section_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          version_id: string
          weight: number
        }
        Insert: {
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          evidence_required?: boolean
          help_text?: string | null
          id?: string
          is_required?: boolean
          item_type: string
          kpi_target?: number | null
          kpi_unit?: string | null
          label: string
          options?: Json
          section_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          version_id: string
          weight?: number
        }
        Update: {
          competency_id?: string | null
          created_at?: string
          created_by?: string | null
          evidence_required?: boolean
          help_text?: string | null
          id?: string
          is_required?: boolean
          item_type?: string
          kpi_target?: number | null
          kpi_unit?: string | null
          label?: string
          options?: Json
          section_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          version_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_items_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "evaluation_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_items_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "evaluation_profile_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_profile_versions: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          created_at: string
          created_by: string | null
          effective_date: string | null
          id: string
          instructions: string | null
          is_demo: boolean
          position_id: string
          profile_id: string
          rating_scale_max: number
          status: string
          updated_at: string
          updated_by: string | null
          version: number
          version_number: number
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          id?: string
          instructions?: string | null
          is_demo?: boolean
          position_id: string
          profile_id: string
          rating_scale_max?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          version_number: number
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          id?: string
          instructions?: string | null
          is_demo?: boolean
          position_id?: string
          profile_id?: string
          rating_scale_max?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_profile_versions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_profile_versions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "evaluation_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_profiles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_demo: boolean
          name: string
          position_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          name: string
          position_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          position_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_responses: {
        Row: {
          assignment_id: string
          choice_values: Json | null
          comment: string | null
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          kpi_actual: number | null
          rating: number | null
          respondent: string
          text_value: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignment_id: string
          choice_values?: Json | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          kpi_actual?: number | null
          rating?: number | null
          respondent: string
          text_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignment_id?: string
          choice_values?: Json | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          kpi_actual?: number | null
          rating?: number | null
          respondent?: string
          text_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_responses_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "evaluation_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_reviews: {
        Row: {
          assignment_id: string
          comments: string | null
          created_at: string
          created_by: string | null
          decision: string
          id: string
          reviewer_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignment_id: string
          comments?: string | null
          created_at?: string
          created_by?: string | null
          decision: string
          id?: string
          reviewer_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignment_id?: string
          comments?: string | null
          created_at?: string
          created_by?: string | null
          decision?: string
          id?: string
          reviewer_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_reviews_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "evaluation_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_sections: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
          version_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
          version_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_sections_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "evaluation_profile_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      file_metadata: {
        Row: {
          bucket: string
          created_at: string
          created_by: string | null
          employee_id: string | null
          id: string
          mime_type: string
          object_path: string
          original_name: string
          size_bytes: number
          updated_at: string
          updated_by: string | null
          uploaded_by: string
        }
        Insert: {
          bucket?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          mime_type: string
          object_path: string
          original_name: string
          size_bytes: number
          updated_at?: string
          updated_by?: string | null
          uploaded_by?: string
        }
        Update: {
          bucket?: string
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          id?: string
          mime_type?: string
          object_path?: string
          original_name?: string
          size_bytes?: number
          updated_at?: string
          updated_by?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_metadata_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key: string
          operation: string
          request_hash: string
          response: Json
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          operation: string
          request_hash: string
          response: Json
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          operation?: string
          request_hash?: string
          response?: Json
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      position_competency_requirements: {
        Row: {
          change_reason: string | null
          competency_id: string
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_current: boolean
          is_demo: boolean
          is_mandatory: boolean
          is_safety_critical: boolean
          position_id: string
          required_level: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          change_reason?: string | null
          competency_id: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          is_demo?: boolean
          is_mandatory?: boolean
          is_safety_critical?: boolean
          position_id: string
          required_level: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          change_reason?: string | null
          competency_id?: string
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_current?: boolean
          is_demo?: boolean
          is_mandatory?: boolean
          is_safety_critical?: boolean
          position_id?: string
          required_level?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_competency_requirements_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_competency_requirements_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          department_id: string
          description: string | null
          id: string
          is_demo: boolean
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          department_id: string
          description?: string | null
          id?: string
          is_demo?: boolean
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          department_id?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      proficiency_levels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          label: string
          level: number
          requires_validation: boolean
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          label: string
          level: number
          requires_validation?: boolean
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          label?: string
          level?: number
          requires_validation?: boolean
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          is_demo?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      reporting_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          employee_id: string
          id: string
          is_current: boolean
          is_demo: boolean
          supervisor_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_id: string
          id?: string
          is_current?: boolean
          is_demo?: boolean
          supervisor_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_id?: string
          id?: string
          is_current?: boolean
          is_demo?: boolean
          supervisor_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reporting_relationships_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporting_relationships_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      status_transitions: {
        Row: {
          created_at: string
          created_by: string | null
          entity: string
          from_status: string
          id: string
          to_status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity: string
          from_status: string
          id?: string
          to_status: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity?: string
          from_status?: string
          id?: string
          to_status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          requires_validation: boolean
          updated_at: string
          updated_by: string | null
          value: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          requires_validation?: boolean
          updated_at?: string
          updated_by?: string | null
          value: Json
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          requires_validation?: boolean
          updated_at?: string
          updated_by?: string | null
          value?: Json
          version?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _idem_get: {
        Args: { _hash: string; _key: string; _op: string }
        Returns: Json
      }
      _idem_put: {
        Args: { _hash: string; _key: string; _op: string; _resp: Json }
        Returns: Json
      }
      _notify: {
        Args: {
          _body: string
          _kind?: string
          _link: string
          _title: string
          _user: string
        }
        Returns: undefined
      }
      _notify_role: {
        Args: {
          _body: string
          _link: string
          _role: Database["public"]["Enums"]["app_role"]
          _title: string
        }
        Returns: undefined
      }
      assert_transition: {
        Args: { _entity: string; _from: string; _to: string }
        Returns: undefined
      }
      can_manage_team_member: { Args: { _emp: string }; Returns: boolean }
      can_view_comp: { Args: { _emp: string }; Returns: boolean }
      can_view_employee: { Args: { _emp: string }; Returns: boolean }
      can_view_perf: { Args: { _emp: string }; Returns: boolean }
      current_role_name: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_perm: { Args: { _perm: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_dept_head_of: { Args: { _emp: string }; Returns: boolean }
      is_supervisor_of: { Args: { _emp: string }; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _details: Json
          _record: string
          _table: string
        }
        Returns: undefined
      }
      my_employee_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "hr_admin"
        | "dept_head"
        | "supervisor"
        | "employee"
        | "ops_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "hr_admin",
        "dept_head",
        "supervisor",
        "employee",
        "ops_manager",
      ],
    },
  },
} as const
