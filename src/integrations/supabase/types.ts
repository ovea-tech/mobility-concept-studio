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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approved_by: string | null
          created_at: string
          decided_at: string | null
          decision_note: string | null
          entity_id: string
          entity_type: string
          id: string
          project_id: string
          requested_by: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          decision_note?: string | null
          entity_id: string
          entity_type: string
          id?: string
          project_id: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          decision_note?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          project_id?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      assumptions: {
        Row: {
          confidence: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          project_id: string
          scenario_id: string
          source: string | null
          title: string
          updated_at: string
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          scenario_id: string
          source?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          confidence?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          scenario_id?: string
          source?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assumptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assumptions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      baseline_requirements: {
        Row: {
          calculation_basis: string | null
          created_at: string
          id: string
          metadata: Json | null
          project_id: string
          required_spaces: number
          rule_reference: string | null
          updated_at: string
          use_type_id: string | null
        }
        Insert: {
          calculation_basis?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id: string
          required_spaces?: number
          rule_reference?: string | null
          updated_at?: string
          use_type_id?: string | null
        }
        Update: {
          calculation_basis?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          required_spaces?: number
          rule_reference?: string | null
          updated_at?: string
          use_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "baseline_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "baseline_requirements_use_type_id_fkey"
            columns: ["use_type_id"]
            isOneToOne: false
            referencedRelation: "use_types"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          project_id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "review_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_versions: {
        Row: {
          concept_id: string
          content: Json | null
          created_at: string
          created_by: string | null
          id: string
          status: Database["public"]["Enums"]["concept_version_status"]
          updated_at: string
          version_number: number
        }
        Insert: {
          concept_id: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["concept_version_status"]
          updated_at?: string
          version_number: number
        }
        Update: {
          concept_id?: string
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["concept_version_status"]
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "concept_versions_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "mobility_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          content: Json | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          pack_version_id: string
          template_type: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          pack_version_id: string
          template_type?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          pack_version_id?: string
          template_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_templates_pack_version_id_fkey"
            columns: ["pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_note: string | null
          created_at: string
          document_id: string
          file_name: string
          file_path: string
          file_size_bytes: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          change_note?: string | null
          created_at?: string
          document_id: string
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          change_note?: string | null
          created_at?: string
          document_id?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_artifacts: {
        Row: {
          artifact_type: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size_bytes: number | null
          file_type: string | null
          id: string
          justification_id: string | null
          measure_id: string | null
          metadata: Json | null
          name: string
          project_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          artifact_type?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          justification_id?: string | null
          measure_id?: string | null
          metadata?: Json | null
          name: string
          project_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          artifact_type?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          justification_id?: string | null
          measure_id?: string | null
          metadata?: Json | null
          name?: string
          project_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_artifacts_justification_id_fkey"
            columns: ["justification_id"]
            isOneToOne: false
            referencedRelation: "justifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_artifacts_measure_id_fkey"
            columns: ["measure_id"]
            isOneToOne: false
            referencedRelation: "measures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_pack_versions: {
        Row: {
          changelog: string | null
          created_at: string
          effective_date: string | null
          id: string
          pack_id: string
          published_at: string | null
          published_by: string | null
          ruleset: Json | null
          status: Database["public"]["Enums"]["pack_status"]
          updated_at: string
          version_label: string | null
          version_number: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          pack_id: string
          published_at?: string | null
          published_by?: string | null
          ruleset?: Json | null
          status?: Database["public"]["Enums"]["pack_status"]
          updated_at?: string
          version_label?: string | null
          version_number: number
        }
        Update: {
          changelog?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          pack_id?: string
          published_at?: string | null
          published_by?: string | null
          ruleset?: Json | null
          status?: Database["public"]["Enums"]["pack_status"]
          updated_at?: string
          version_label?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_pack_versions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdiction_packs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          municipality_id: string
          name: string
          status: Database["public"]["Enums"]["pack_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          municipality_id: string
          name: string
          status?: Database["public"]["Enums"]["pack_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          municipality_id?: string
          name?: string
          status?: Database["public"]["Enums"]["pack_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_packs_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      justifications: {
        Row: {
          assumption_id: string | null
          content: string | null
          created_at: string
          id: string
          justification_type: string | null
          measure_id: string | null
          metadata: Json | null
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assumption_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          justification_type?: string | null
          measure_id?: string | null
          metadata?: Json | null
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assumption_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          justification_type?: string | null
          measure_id?: string | null
          metadata?: Json | null
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "justifications_assumption_id_fkey"
            columns: ["assumption_id"]
            isOneToOne: false
            referencedRelation: "assumptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justifications_measure_id_fkey"
            columns: ["measure_id"]
            isOneToOne: false
            referencedRelation: "measures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      measure_obligations: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          measure_id: string
          obligation_type: string
          responsible_party: string | null
          status: Database["public"]["Enums"]["monitoring_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          measure_id: string
          obligation_type: string
          responsible_party?: string | null
          status?: Database["public"]["Enums"]["monitoring_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          measure_id?: string
          obligation_type?: string
          responsible_party?: string | null
          status?: Database["public"]["Enums"]["monitoring_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measure_obligations_measure_id_fkey"
            columns: ["measure_id"]
            isOneToOne: false
            referencedRelation: "measures"
            referencedColumns: ["id"]
          },
        ]
      }
      measures: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          project_id: string
          reduction_unit: string | null
          reduction_value: number | null
          scenario_id: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          reduction_unit?: string | null
          reduction_value?: number | null
          scenario_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          reduction_unit?: string | null
          reduction_value?: number | null
          scenario_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measures_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["membership_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["membership_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mobility_concepts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobility_concepts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_items: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          measure_id: string | null
          metadata: Json | null
          obligation_id: string | null
          project_id: string
          status: Database["public"]["Enums"]["monitoring_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          measure_id?: string | null
          metadata?: Json | null
          obligation_id?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["monitoring_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          measure_id?: string | null
          metadata?: Json | null
          obligation_id?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["monitoring_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_items_measure_id_fkey"
            columns: ["measure_id"]
            isOneToOne: false
            referencedRelation: "measures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_items_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "measure_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          area_km2: number | null
          created_at: string
          id: string
          metadata: Json | null
          municipal_code: string | null
          name: string
          population: number | null
          state: string
          updated_at: string
        }
        Insert: {
          area_km2?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          municipal_code?: string | null
          name: string
          population?: number | null
          state: string
          updated_at?: string
        }
        Update: {
          area_km2?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          municipal_code?: string | null
          name?: string
          population?: number | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      output_packages: {
        Row: {
          created_at: string
          file_name: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_type: string | null
          generated_by: string | null
          id: string
          name: string
          package_type: string | null
          project_id: string
          submission_snapshot_id: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          generated_by?: string | null
          id?: string
          name: string
          package_type?: string | null
          project_id: string
          submission_snapshot_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          generated_by?: string | null
          id?: string
          name?: string
          package_type?: string | null
          project_id?: string
          submission_snapshot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "output_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "output_packages_submission_snapshot_id_fkey"
            columns: ["submission_snapshot_id"]
            isOneToOne: false
            referencedRelation: "submission_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_change_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          pack_version_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          pack_version_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          pack_version_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pack_change_logs_pack_version_id_fkey"
            columns: ["pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_releases: {
        Row: {
          created_at: string
          id: string
          pack_version_id: string
          release_notes: string | null
          released_at: string
          released_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          pack_version_id: string
          release_notes?: string | null
          released_at?: string
          released_by: string
        }
        Update: {
          created_at?: string
          id?: string
          pack_version_id?: string
          release_notes?: string | null
          released_at?: string
          released_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_releases_pack_version_id_fkey"
            columns: ["pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_reviews: {
        Row: {
          created_at: string
          id: string
          pack_version_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          pack_version_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          pack_version_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_reviews_pack_version_id_fkey"
            columns: ["pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_test_cases: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          expected_output: Json
          id: string
          input_data: Json
          name: string
          pack_version_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_output?: Json
          id?: string
          input_data?: Json
          name: string
          pack_version_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_output?: Json
          id?: string
          input_data?: Json
          name?: string
          pack_version_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_test_cases_pack_version_id_fkey"
            columns: ["pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_test_runs: {
        Row: {
          actual_output: Json | null
          error_message: string | null
          id: string
          pack_version_id: string
          passed: boolean | null
          run_at: string
          run_by: string | null
          test_case_id: string
        }
        Insert: {
          actual_output?: Json | null
          error_message?: string | null
          id?: string
          pack_version_id: string
          passed?: boolean | null
          run_at?: string
          run_by?: string | null
          test_case_id: string
        }
        Update: {
          actual_output?: Json | null
          error_message?: string | null
          id?: string
          pack_version_id?: string
          passed?: boolean | null
          run_at?: string
          run_by?: string | null
          test_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_test_runs_pack_version_id_fkey"
            columns: ["pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_test_runs_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "pack_test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          name: string
          project_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sites: {
        Row: {
          address: string | null
          area_sqm: number | null
          cadastral_ref: string | null
          created_at: string
          id: string
          metadata: Json | null
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          cadastral_ref?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          cadastral_ref?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          erected_parking_spaces: number | null
          id: string
          jurisdiction_pack_version_id: string
          mf_calculated_at: string | null
          mf_calculated_by: string | null
          mf_calculation_locked: boolean
          mobility_factor: number | null
          name: string
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          erected_parking_spaces?: number | null
          id?: string
          jurisdiction_pack_version_id: string
          mf_calculated_at?: string | null
          mf_calculated_by?: string | null
          mf_calculation_locked?: boolean
          mobility_factor?: number | null
          name: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          erected_parking_spaces?: number | null
          id?: string
          jurisdiction_pack_version_id?: string
          mf_calculated_at?: string | null
          mf_calculated_by?: string | null
          mf_calculation_locked?: boolean
          mobility_factor?: number | null
          name?: string
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_jurisdiction_pack_version_id_fkey"
            columns: ["jurisdiction_pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_dismissed: boolean
          project_id: string
          remind_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_dismissed?: boolean
          project_id: string
          remind_at: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_dismissed?: boolean
          project_id?: string
          remind_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      review_threads: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["review_thread_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["review_thread_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["review_thread_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_candidates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          municipality_id: string
          raw_text: string | null
          source_document_id: string | null
          status: Database["public"]["Enums"]["rule_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          municipality_id: string
          raw_text?: string | null
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["rule_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          municipality_id?: string
          raw_text?: string | null
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["rule_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_candidates_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_candidates_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_set_rules: {
        Row: {
          created_at: string
          id: string
          rule_id: string
          rule_set_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          rule_id: string
          rule_set_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          rule_id?: string
          rule_set_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "rule_set_rules_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_set_rules_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_sets: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          pack_version_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pack_version_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pack_version_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_sets_pack_version_id_fkey"
            columns: ["pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          category: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          logic_expression: Json | null
          pack_version_id: string
          parameters: Json | null
          rule_candidate_id: string | null
          rule_type: string | null
          status: Database["public"]["Enums"]["rule_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logic_expression?: Json | null
          pack_version_id: string
          parameters?: Json | null
          rule_candidate_id?: string | null
          rule_type?: string | null
          status?: Database["public"]["Enums"]["rule_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logic_expression?: Json | null
          pack_version_id?: string
          parameters?: Json | null
          rule_candidate_id?: string | null
          rule_type?: string | null
          status?: Database["public"]["Enums"]["rule_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rules_pack_version_id_fkey"
            columns: ["pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rules_rule_candidate_id_fkey"
            columns: ["rule_candidate_id"]
            isOneToOne: false
            referencedRelation: "rule_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          concept_version_id: string
          created_at: string
          description: string | null
          id: string
          is_baseline: boolean
          metadata: Json | null
          name: string
          project_id: string
          total_reduction_pct: number | null
          updated_at: string
        }
        Insert: {
          concept_version_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_baseline?: boolean
          metadata?: Json | null
          name: string
          project_id: string
          total_reduction_pct?: number | null
          updated_at?: string
        }
        Update: {
          concept_version_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_baseline?: boolean
          metadata?: Json | null
          name?: string
          project_id?: string
          total_reduction_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_concept_version_id_fkey"
            columns: ["concept_version_id"]
            isOneToOne: false
            referencedRelation: "concept_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_locations: {
        Row: {
          boundary: unknown
          created_at: string
          id: string
          label: string | null
          location: unknown
          site_id: string
        }
        Insert: {
          boundary?: unknown
          created_at?: string
          id?: string
          label?: string | null
          location?: unknown
          site_id: string
        }
        Update: {
          boundary?: unknown
          created_at?: string
          id?: string
          label?: string | null
          location?: unknown
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_locations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      source_documents: {
        Row: {
          created_at: string
          document_type: string | null
          file_name: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          municipality_id: string
          name: string
          source_url: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          municipality_id: string
          name: string
          source_url?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          municipality_id?: string
          name?: string
          source_url?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      submission_snapshots: {
        Row: {
          concept_version_id: string | null
          created_at: string
          id: string
          project_id: string
          snapshot_data: Json
          submitted_at: string | null
          submitted_by: string | null
          version_label: string
        }
        Insert: {
          concept_version_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          snapshot_data?: Json
          submitted_at?: string | null
          submitted_by?: string | null
          version_label: string
        }
        Update: {
          concept_version_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          snapshot_data?: Json
          submitted_at?: string | null
          submitted_by?: string | null
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_snapshots_concept_version_id_fkey"
            columns: ["concept_version_id"]
            isOneToOne: false
            referencedRelation: "concept_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      use_types: {
        Row: {
          category: string | null
          created_at: string
          gross_floor_area_sqm: number | null
          id: string
          metadata: Json | null
          name: string
          project_id: string
          site_id: string | null
          unit_count: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          gross_floor_area_sqm?: number | null
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          site_id?: string | null
          unit_count?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          gross_floor_area_sqm?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          site_id?: string | null
          unit_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "use_types_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "use_types_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "project_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_definitions: {
        Row: {
          boundary: unknown
          created_at: string
          description: string | null
          id: string
          name: string
          pack_version_id: string
          parameters: Json | null
          updated_at: string
          zone_type: string | null
        }
        Insert: {
          boundary?: unknown
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pack_version_id: string
          parameters?: Json | null
          updated_at?: string
          zone_type?: string | null
        }
        Update: {
          boundary?: unknown
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pack_version_id?: string
          parameters?: Json | null
          updated_at?: string
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_definitions_pack_version_id_fkey"
            columns: ["pack_version_id"]
            isOneToOne: false
            referencedRelation: "jurisdiction_pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      can_assign_membership_role: {
        Args: {
          _assigner_id: string
          _org_id: string
          _target_role: Database["public"]["Enums"]["membership_role"]
        }
        Returns: boolean
      }
      can_edit_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_membership_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["membership_role"]
      }
      get_project_org_id: { Args: { _project_id: string }; Returns: string }
      gettransactionid: { Args: never; Returns: unknown }
      has_platform_role: {
        Args: {
          _role: Database["public"]["Enums"]["platform_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_internal_user: { Args: { _user_id: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      approval_status:
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "withdrawn"
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "status_change"
        | "login"
        | "role_change"
        | "export"
        | "submission"
      concept_version_status: "draft" | "final" | "submitted" | "superseded"
      membership_role:
        | "org_owner"
        | "org_admin"
        | "project_editor"
        | "project_reviewer"
        | "viewer"
      monitoring_status:
        | "pending"
        | "in_progress"
        | "compliant"
        | "non_compliant"
        | "waived"
      pack_status:
        | "draft"
        | "in_review"
        | "approved"
        | "released"
        | "deprecated"
      platform_role:
        | "platform_admin"
        | "internal_pack_editor"
        | "internal_pack_reviewer"
      project_status: "draft" | "active" | "submitted" | "approved" | "archived"
      review_thread_status: "open" | "resolved" | "wont_fix"
      rule_status: "candidate" | "draft" | "active" | "deprecated"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      approval_status: [
        "pending",
        "in_review",
        "approved",
        "rejected",
        "withdrawn",
      ],
      audit_action: [
        "create",
        "update",
        "delete",
        "status_change",
        "login",
        "role_change",
        "export",
        "submission",
      ],
      concept_version_status: ["draft", "final", "submitted", "superseded"],
      membership_role: [
        "org_owner",
        "org_admin",
        "project_editor",
        "project_reviewer",
        "viewer",
      ],
      monitoring_status: [
        "pending",
        "in_progress",
        "compliant",
        "non_compliant",
        "waived",
      ],
      pack_status: ["draft", "in_review", "approved", "released", "deprecated"],
      platform_role: [
        "platform_admin",
        "internal_pack_editor",
        "internal_pack_reviewer",
      ],
      project_status: ["draft", "active", "submitted", "approved", "archived"],
      review_thread_status: ["open", "resolved", "wont_fix"],
      rule_status: ["candidate", "draft", "active", "deprecated"],
    },
  },
} as const
