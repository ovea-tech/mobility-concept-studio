
-- ============================================================
-- MOBILITY COMPLIANCE PLATFORM — FINAL PRODUCTION MIGRATION
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. ENUMS
CREATE TYPE public.platform_role AS ENUM (
  'platform_admin',
  'internal_pack_editor',
  'internal_pack_reviewer'
);

CREATE TYPE public.membership_role AS ENUM (
  'org_owner',
  'org_admin',
  'project_editor',
  'project_reviewer',
  'viewer'
);

CREATE TYPE public.pack_status AS ENUM (
  'draft',
  'in_review',
  'approved',
  'released',
  'deprecated'
);

CREATE TYPE public.rule_status AS ENUM (
  'candidate',
  'draft',
  'active',
  'deprecated'
);

CREATE TYPE public.project_status AS ENUM (
  'draft',
  'active',
  'submitted',
  'approved',
  'archived'
);

CREATE TYPE public.approval_status AS ENUM (
  'pending',
  'in_review',
  'approved',
  'rejected',
  'withdrawn'
);

CREATE TYPE public.concept_version_status AS ENUM (
  'draft',
  'final',
  'submitted',
  'superseded'
);

CREATE TYPE public.review_thread_status AS ENUM (
  'open',
  'resolved',
  'wont_fix'
);

CREATE TYPE public.monitoring_status AS ENUM (
  'pending',
  'in_progress',
  'compliant',
  'non_compliant',
  'waived'
);

CREATE TYPE public.audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'status_change',
  'login',
  'role_change',
  'export',
  'submission'
);

-- 3. TABLES — CORE ADMIN

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.platform_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.membership_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  action public.audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLES — SHARED / REFERENCE

CREATE TABLE public.municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  municipal_code TEXT UNIQUE,
  population INTEGER,
  area_km2 NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.jurisdiction_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  status public.pack_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.jurisdiction_pack_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.jurisdiction_packs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  status public.pack_status NOT NULL DEFAULT 'draft',
  effective_date DATE,
  changelog TEXT,
  published_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, version_number)
);

-- 5. TABLES — CUSTOMER PRODUCT

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE RESTRICT,
  jurisdiction_pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.project_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  cadastral_ref TEXT,
  area_sqm NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.project_sites(id) ON DELETE CASCADE,
  label TEXT,
  location GEOMETRY(Point, 4326),
  boundary GEOMETRY(Polygon, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.use_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.project_sites(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  unit_count INTEGER,
  gross_floor_area_sqm NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.baseline_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  use_type_id UUID REFERENCES public.use_types(id) ON DELETE SET NULL,
  required_spaces NUMERIC NOT NULL DEFAULT 0,
  calculation_basis TEXT,
  rule_reference TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mobility_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.concept_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES public.mobility_concepts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status public.concept_version_status NOT NULL DEFAULT 'draft',
  content JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (concept_id, version_number)
);

CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_version_id UUID NOT NULL REFERENCES public.concept_versions(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_baseline BOOLEAN NOT NULL DEFAULT false,
  total_reduction_pct NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  reduction_value NUMERIC,
  reduction_unit TEXT,
  status TEXT NOT NULL DEFAULT 'proposed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.measure_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measure_id UUID NOT NULL REFERENCES public.measures(id) ON DELETE CASCADE,
  obligation_type TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  responsible_party TEXT,
  status public.monitoring_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  confidence TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.justifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  measure_id UUID REFERENCES public.measures(id) ON DELETE CASCADE,
  assumption_id UUID REFERENCES public.assumptions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  justification_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT justification_exactly_one_parent CHECK (
    (measure_id IS NOT NULL AND assumption_id IS NULL) OR
    (measure_id IS NULL AND assumption_id IS NOT NULL)
  )
);

CREATE TABLE public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  document_type TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.project_documents IS 'Storage bucket: project-documents';

CREATE TABLE public.evidence_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  justification_id UUID REFERENCES public.justifications(id) ON DELETE SET NULL,
  measure_id UUID REFERENCES public.measures(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  artifact_type TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.evidence_artifacts IS 'Storage bucket: evidence';

CREATE TABLE public.submission_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  concept_version_id UUID REFERENCES public.concept_versions(id),
  version_label TEXT NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.output_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submission_snapshot_id UUID REFERENCES public.submission_snapshots(id),
  name TEXT NOT NULL,
  package_type TEXT,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size_bytes BIGINT,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.output_packages IS 'Storage bucket: output-packages';

CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  status public.approval_status NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  decision_note TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.review_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  status public.review_thread_status NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.review_threads(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.monitoring_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  measure_id UUID REFERENCES public.measures(id) ON DELETE SET NULL,
  obligation_id UUID REFERENCES public.measure_obligations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.monitoring_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entity_type TEXT,
  entity_id UUID,
  title TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLES — INTERNAL PACK STUDIO

CREATE TABLE public.source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  document_type TEXT,
  source_url TEXT,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.source_documents IS 'Storage bucket: source-documents. Internal only.';

CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.source_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  change_note TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_number)
);

CREATE TABLE public.rule_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id) ON DELETE RESTRICT,
  source_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  raw_text TEXT,
  status public.rule_status NOT NULL DEFAULT 'candidate',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE CASCADE,
  rule_candidate_id UUID REFERENCES public.rule_candidates(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  rule_type TEXT,
  parameters JSONB DEFAULT '{}',
  logic_expression JSONB DEFAULT '{}',
  status public.rule_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rule_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.rule_set_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_id UUID NOT NULL REFERENCES public.rule_sets(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.rules(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_set_id, rule_id)
);

CREATE TABLE public.zone_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zone_type TEXT,
  description TEXT,
  boundary GEOMETRY(Polygon, 4326),
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT,
  content JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pack_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  status public.approval_status NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pack_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  input_data JSONB NOT NULL DEFAULT '{}',
  expected_output JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pack_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_case_id UUID NOT NULL REFERENCES public.pack_test_cases(id) ON DELETE CASCADE,
  pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE CASCADE,
  passed BOOLEAN,
  actual_output JSONB,
  error_message TEXT,
  run_by UUID REFERENCES auth.users(id),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pack_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE CASCADE,
  released_by UUID NOT NULL REFERENCES auth.users(id),
  release_notes TEXT,
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pack_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_version_id UUID NOT NULL REFERENCES public.jurisdiction_pack_versions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SECURITY DEFINER FUNCTIONS

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'platform_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_internal_user(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id UUID, _role public.platform_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.get_project_org_id(_project_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT w.organization_id FROM public.projects p JOIN public.workspaces w ON w.id = p.workspace_id WHERE p.id = _project_id;
$$;

CREATE OR REPLACE FUNCTION public.has_project_access(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (
    public.is_platform_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      JOIN public.memberships m ON m.organization_id = w.organization_id
      WHERE p.id = _project_id AND m.user_id = _user_id
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_project(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (
    public.is_platform_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.workspaces w ON w.id = p.workspace_id
      JOIN public.memberships m ON m.organization_id = w.organization_id
      WHERE p.id = _project_id AND m.user_id = _user_id
        AND m.role IN ('org_owner', 'org_admin', 'project_editor')
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_membership_role(_user_id UUID, _org_id UUID)
RETURNS public.membership_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.memberships WHERE user_id = _user_id AND organization_id = _org_id;
$$;

CREATE OR REPLACE FUNCTION public.can_assign_membership_role(_assigner_id UUID, _org_id UUID, _target_role public.membership_role)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _assigner_role public.membership_role;
BEGIN
  IF public.is_platform_admin(_assigner_id) THEN RETURN true; END IF;
  SELECT role INTO _assigner_role FROM public.memberships WHERE user_id = _assigner_id AND organization_id = _org_id;
  IF _assigner_role IS NULL THEN RETURN false; END IF;
  IF _assigner_role = 'org_owner' AND _target_role IN ('org_admin','project_editor','project_reviewer','viewer') THEN RETURN true; END IF;
  IF _assigner_role = 'org_admin' AND _target_role IN ('project_editor','project_reviewer','viewer') THEN RETURN true; END IF;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.memberships WHERE user_id = _user_id AND organization_id = _org_id);
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (public.is_platform_admin(_user_id) OR EXISTS (
    SELECT 1 FROM public.memberships WHERE user_id = _user_id AND organization_id = _org_id AND role = 'org_owner'
  ));
$$;

CREATE OR REPLACE FUNCTION public.can_manage_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (public.is_platform_admin(_user_id) OR EXISTS (
    SELECT 1 FROM public.memberships WHERE user_id = _user_id AND organization_id = _org_id AND role IN ('org_owner','org_admin')
  ));
$$;

-- 8. TRIGGERS

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
    GROUP BY table_name
  LOOP
    EXECUTE format('CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ENABLE RLS

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdiction_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdiction_pack_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.use_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baseline_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measure_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.output_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_set_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_change_logs ENABLE ROW LEVEL SECURITY;

-- 10. RLS POLICIES

-- PROFILES
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_platform_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.memberships m1 JOIN public.memberships m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
  ));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_platform_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- USER_ROLES
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));
CREATE POLICY user_roles_insert ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY user_roles_update ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY user_roles_delete ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- ORGANIZATIONS
CREATE POLICY orgs_select ON public.organizations FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_org_member(auth.uid(), id));
CREATE POLICY orgs_insert ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY orgs_update ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_org_owner(auth.uid(), id)) WITH CHECK (public.is_org_owner(auth.uid(), id));
CREATE POLICY orgs_delete ON public.organizations FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- WORKSPACES
CREATE POLICY ws_select ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_org_member(auth.uid(), organization_id));
CREATE POLICY ws_insert ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_org(auth.uid(), organization_id));
CREATE POLICY ws_update ON public.workspaces FOR UPDATE TO authenticated
  USING (public.can_manage_org(auth.uid(), organization_id)) WITH CHECK (public.can_manage_org(auth.uid(), organization_id));
CREATE POLICY ws_delete ON public.workspaces FOR DELETE TO authenticated
  USING (public.is_org_owner(auth.uid(), organization_id));

-- MEMBERSHIPS
CREATE POLICY memberships_select ON public.memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()) OR public.is_org_member(auth.uid(), organization_id));
CREATE POLICY memberships_insert ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (public.can_assign_membership_role(auth.uid(), organization_id, role));
CREATE POLICY memberships_update ON public.memberships FOR UPDATE TO authenticated
  USING (public.can_assign_membership_role(auth.uid(), organization_id, role))
  WITH CHECK (public.can_assign_membership_role(auth.uid(), organization_id, role));
CREATE POLICY memberships_delete ON public.memberships FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_org_owner(auth.uid(), organization_id));

-- AUDIT_EVENTS (KORREKTUR 1: gehärtet — user_id = auth.uid() erzwungen)
CREATE POLICY audit_select ON public.audit_events FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));
CREATE POLICY audit_insert ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- MUNICIPALITIES (reference data: all read, internal write)
CREATE POLICY muni_select ON public.municipalities FOR SELECT TO authenticated USING (true);
CREATE POLICY muni_insert ON public.municipalities FOR INSERT TO authenticated
  WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY muni_update ON public.municipalities FOR UPDATE TO authenticated
  USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY muni_delete ON public.municipalities FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- JURISDICTION_PACKS
CREATE POLICY jp_select ON public.jurisdiction_packs FOR SELECT TO authenticated
  USING (public.is_internal_user(auth.uid()) OR status = 'released');
CREATE POLICY jp_insert ON public.jurisdiction_packs FOR INSERT TO authenticated
  WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY jp_update ON public.jurisdiction_packs FOR UPDATE TO authenticated
  USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY jp_delete ON public.jurisdiction_packs FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- JURISDICTION_PACK_VERSIONS
CREATE POLICY jpv_select ON public.jurisdiction_pack_versions FOR SELECT TO authenticated
  USING (public.is_internal_user(auth.uid()) OR status = 'released');
CREATE POLICY jpv_insert ON public.jurisdiction_pack_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY jpv_update ON public.jurisdiction_pack_versions FOR UPDATE TO authenticated
  USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY jpv_delete ON public.jurisdiction_pack_versions FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- PROJECTS
CREATE POLICY projects_select ON public.projects FOR SELECT TO authenticated
  USING (public.has_project_access(auth.uid(), id));
CREATE POLICY projects_insert ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin(auth.uid())
    OR public.can_manage_org(auth.uid(), (SELECT w.organization_id FROM public.workspaces w WHERE w.id = workspace_id))
  );
CREATE POLICY projects_update ON public.projects FOR UPDATE TO authenticated
  USING (public.can_edit_project(auth.uid(), id)) WITH CHECK (public.can_edit_project(auth.uid(), id));
CREATE POLICY projects_delete ON public.projects FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()) OR public.is_org_owner(auth.uid(), public.get_project_org_id(id)));

-- PROJECT-SCOPED TABLES (read: has_project_access, write: can_edit_project)

CREATE POLICY ps_select ON public.project_sites FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY ps_insert ON public.project_sites FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY ps_update ON public.project_sites FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY ps_delete ON public.project_sites FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY sl_select ON public.site_locations FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), (SELECT ps.project_id FROM public.project_sites ps WHERE ps.id = site_id)));
CREATE POLICY sl_insert ON public.site_locations FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), (SELECT ps.project_id FROM public.project_sites ps WHERE ps.id = site_id)));
CREATE POLICY sl_update ON public.site_locations FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), (SELECT ps.project_id FROM public.project_sites ps WHERE ps.id = site_id))) WITH CHECK (public.can_edit_project(auth.uid(), (SELECT ps.project_id FROM public.project_sites ps WHERE ps.id = site_id)));
CREATE POLICY sl_delete ON public.site_locations FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), (SELECT ps.project_id FROM public.project_sites ps WHERE ps.id = site_id)));

CREATE POLICY ut_select ON public.use_types FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY ut_insert ON public.use_types FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY ut_update ON public.use_types FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY ut_delete ON public.use_types FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY br_select ON public.baseline_requirements FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY br_insert ON public.baseline_requirements FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY br_update ON public.baseline_requirements FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY br_delete ON public.baseline_requirements FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY mc_select ON public.mobility_concepts FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY mc_insert ON public.mobility_concepts FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY mc_update ON public.mobility_concepts FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY mc_delete ON public.mobility_concepts FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY cv_select ON public.concept_versions FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), (SELECT mc.project_id FROM public.mobility_concepts mc WHERE mc.id = concept_id)));
CREATE POLICY cv_insert ON public.concept_versions FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), (SELECT mc.project_id FROM public.mobility_concepts mc WHERE mc.id = concept_id)));
CREATE POLICY cv_update ON public.concept_versions FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), (SELECT mc.project_id FROM public.mobility_concepts mc WHERE mc.id = concept_id))) WITH CHECK (public.can_edit_project(auth.uid(), (SELECT mc.project_id FROM public.mobility_concepts mc WHERE mc.id = concept_id)));
CREATE POLICY cv_delete ON public.concept_versions FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), (SELECT mc.project_id FROM public.mobility_concepts mc WHERE mc.id = concept_id)));

CREATE POLICY sc_select ON public.scenarios FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY sc_insert ON public.scenarios FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY sc_update ON public.scenarios FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY sc_delete ON public.scenarios FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY meas_select ON public.measures FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY meas_insert ON public.measures FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY meas_update ON public.measures FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY meas_delete ON public.measures FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY mo_select ON public.measure_obligations FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), (SELECT m.project_id FROM public.measures m WHERE m.id = measure_id)));
CREATE POLICY mo_insert ON public.measure_obligations FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), (SELECT m.project_id FROM public.measures m WHERE m.id = measure_id)));
CREATE POLICY mo_update ON public.measure_obligations FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), (SELECT m.project_id FROM public.measures m WHERE m.id = measure_id))) WITH CHECK (public.can_edit_project(auth.uid(), (SELECT m.project_id FROM public.measures m WHERE m.id = measure_id)));
CREATE POLICY mo_delete ON public.measure_obligations FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), (SELECT m.project_id FROM public.measures m WHERE m.id = measure_id)));

CREATE POLICY asn_select ON public.assumptions FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY asn_insert ON public.assumptions FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY asn_update ON public.assumptions FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY asn_delete ON public.assumptions FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY jst_select ON public.justifications FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY jst_insert ON public.justifications FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY jst_update ON public.justifications FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY jst_delete ON public.justifications FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY pd_select ON public.project_documents FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY pd_insert ON public.project_documents FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY pd_update ON public.project_documents FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY pd_delete ON public.project_documents FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY ea_select ON public.evidence_artifacts FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY ea_insert ON public.evidence_artifacts FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY ea_update ON public.evidence_artifacts FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY ea_delete ON public.evidence_artifacts FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY ss_select ON public.submission_snapshots FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY ss_insert ON public.submission_snapshots FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY op_select ON public.output_packages FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY op_insert ON public.output_packages FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY apr_select ON public.approvals FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY apr_insert ON public.approvals FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY apr_update ON public.approvals FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY rt_select ON public.review_threads FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY rt_insert ON public.review_threads FOR INSERT TO authenticated WITH CHECK (public.has_project_access(auth.uid(), project_id));
CREATE POLICY rt_update ON public.review_threads FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY cmt_select ON public.comments FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY cmt_insert ON public.comments FOR INSERT TO authenticated WITH CHECK (public.has_project_access(auth.uid(), project_id) AND author_id = auth.uid());
CREATE POLICY cmt_update ON public.comments FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY cmt_delete ON public.comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.can_edit_project(auth.uid(), project_id));

CREATE POLICY mi_select ON public.monitoring_items FOR SELECT TO authenticated USING (public.has_project_access(auth.uid(), project_id));
CREATE POLICY mi_insert ON public.monitoring_items FOR INSERT TO authenticated WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY mi_update ON public.monitoring_items FOR UPDATE TO authenticated USING (public.can_edit_project(auth.uid(), project_id)) WITH CHECK (public.can_edit_project(auth.uid(), project_id));
CREATE POLICY mi_delete ON public.monitoring_items FOR DELETE TO authenticated USING (public.can_edit_project(auth.uid(), project_id));

CREATE POLICY rem_select ON public.reminders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY rem_insert ON public.reminders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.has_project_access(auth.uid(), project_id));
CREATE POLICY rem_update ON public.reminders FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY rem_delete ON public.reminders FOR DELETE TO authenticated USING (user_id = auth.uid());

-- INTERNAL PACK STUDIO TABLES (internal-only write, selective read)

CREATE POLICY sd_select ON public.source_documents FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()));
CREATE POLICY sd_insert ON public.source_documents FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY sd_update ON public.source_documents FOR UPDATE TO authenticated USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY sd_delete ON public.source_documents FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE POLICY dv_select ON public.document_versions FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()));
CREATE POLICY dv_insert ON public.document_versions FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY dv_delete ON public.document_versions FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE POLICY rc_select ON public.rule_candidates FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()));
CREATE POLICY rc_insert ON public.rule_candidates FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY rc_update ON public.rule_candidates FOR UPDATE TO authenticated USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY rc_delete ON public.rule_candidates FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

-- RULES (KORREKTUR 2: released pack versions lesbar für Customer Product)
CREATE POLICY rules_select ON public.rules FOR SELECT TO authenticated
  USING (
    public.is_internal_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.jurisdiction_pack_versions jpv
      WHERE jpv.id = pack_version_id AND jpv.status = 'released'
    )
  );
CREATE POLICY rules_insert ON public.rules FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY rules_update ON public.rules FOR UPDATE TO authenticated USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY rules_delete ON public.rules FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

-- RULE_SETS (KORREKTUR 2: released pack versions lesbar für Customer Product)
CREATE POLICY rs_select ON public.rule_sets FOR SELECT TO authenticated
  USING (
    public.is_internal_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.jurisdiction_pack_versions jpv
      WHERE jpv.id = pack_version_id AND jpv.status = 'released'
    )
  );
CREATE POLICY rs_insert ON public.rule_sets FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY rs_update ON public.rule_sets FOR UPDATE TO authenticated USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY rs_delete ON public.rule_sets FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

-- RULE_SET_RULES (KORREKTUR 2: released pack versions lesbar über rule_set)
CREATE POLICY rsr_select ON public.rule_set_rules FOR SELECT TO authenticated
  USING (
    public.is_internal_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.rule_sets rs
      JOIN public.jurisdiction_pack_versions jpv ON jpv.id = rs.pack_version_id
      WHERE rs.id = rule_set_id AND jpv.status = 'released'
    )
  );
CREATE POLICY rsr_insert ON public.rule_set_rules FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY rsr_delete ON public.rule_set_rules FOR DELETE TO authenticated USING (public.is_internal_user(auth.uid()));

CREATE POLICY zd_select ON public.zone_definitions FOR SELECT TO authenticated
  USING (
    public.is_internal_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.jurisdiction_pack_versions jpv
      WHERE jpv.id = pack_version_id AND jpv.status = 'released'
    )
  );
CREATE POLICY zd_insert ON public.zone_definitions FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY zd_update ON public.zone_definitions FOR UPDATE TO authenticated USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY zd_delete ON public.zone_definitions FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE POLICY ct_select ON public.content_templates FOR SELECT TO authenticated
  USING (
    public.is_internal_user(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.jurisdiction_pack_versions jpv
      WHERE jpv.id = pack_version_id AND jpv.status = 'released'
    )
  );
CREATE POLICY ct_insert ON public.content_templates FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY ct_update ON public.content_templates FOR UPDATE TO authenticated USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY ct_delete ON public.content_templates FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE POLICY pr_select ON public.pack_reviews FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()));
CREATE POLICY pr_insert ON public.pack_reviews FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY pr_update ON public.pack_reviews FOR UPDATE TO authenticated USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));

CREATE POLICY ptc_select ON public.pack_test_cases FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()));
CREATE POLICY ptc_insert ON public.pack_test_cases FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY ptc_update ON public.pack_test_cases FOR UPDATE TO authenticated USING (public.is_internal_user(auth.uid())) WITH CHECK (public.is_internal_user(auth.uid()));
CREATE POLICY ptc_delete ON public.pack_test_cases FOR DELETE TO authenticated USING (public.is_internal_user(auth.uid()));

CREATE POLICY ptr_select ON public.pack_test_runs FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()));
CREATE POLICY ptr_insert ON public.pack_test_runs FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));

CREATE POLICY prl_select ON public.pack_releases FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()));
CREATE POLICY prl_insert ON public.pack_releases FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));

CREATE POLICY pcl_select ON public.pack_change_logs FOR SELECT TO authenticated USING (public.is_internal_user(auth.uid()));
CREATE POLICY pcl_insert ON public.pack_change_logs FOR INSERT TO authenticated WITH CHECK (public.is_internal_user(auth.uid()));

-- 11. INDEXES

CREATE INDEX idx_memberships_user ON public.memberships(user_id);
CREATE INDEX idx_memberships_org ON public.memberships(organization_id);
CREATE INDEX idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX idx_projects_pack_version ON public.projects(jurisdiction_pack_version_id);
CREATE INDEX idx_project_sites_project ON public.project_sites(project_id);
CREATE INDEX idx_measures_project ON public.measures(project_id);
CREATE INDEX idx_measures_scenario ON public.measures(scenario_id);
CREATE INDEX idx_assumptions_project ON public.assumptions(project_id);
CREATE INDEX idx_scenarios_project ON public.scenarios(project_id);
CREATE INDEX idx_rules_pack_version ON public.rules(pack_version_id);
CREATE INDEX idx_rule_sets_pack_version ON public.rule_sets(pack_version_id);
CREATE INDEX idx_rule_set_rules_set ON public.rule_set_rules(rule_set_id);
CREATE INDEX idx_rule_set_rules_rule ON public.rule_set_rules(rule_id);
CREATE INDEX idx_audit_events_user ON public.audit_events(user_id);
CREATE INDEX idx_audit_events_entity ON public.audit_events(entity_type, entity_id);
CREATE INDEX idx_comments_thread ON public.comments(thread_id);
CREATE INDEX idx_workspaces_org ON public.workspaces(organization_id);
CREATE INDEX idx_jpv_pack ON public.jurisdiction_pack_versions(pack_id);
CREATE INDEX idx_jpv_status ON public.jurisdiction_pack_versions(status);
