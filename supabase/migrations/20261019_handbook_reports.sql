-- Review and run in Supabase SQL Editor BEFORE deploying the accompanying pages.
-- Keeps historical rows and original SELECT / UPDATE / DELETE policies.
BEGIN;

ALTER TABLE public.reports
  ALTER COLUMN severity DROP NOT NULL,
  ALTER COLUMN severity DROP DEFAULT,
  ADD COLUMN IF NOT EXISTS offense_classification text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS classification_note text,
  ADD COLUMN IF NOT EXISTS classified_by uuid,
  ADD COLUMN IF NOT EXISTS classified_at timestamptz;

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_category_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_category_check CHECK (
  category IN ('physical_emotional_harm', 'public_display_of_affection', 'verbal_abuse', 'unauthorized_weapons', 'substances_on_campus', 'plagiarism', 'falsification', 'theft', 'malicious_mischief', 'gambling', 'prohibited_organizations', 'disrespect_disobedience', 'arson', 'sexual_assault_harassment', 'bullying', 'cyberbullying', 'malversation', 'hazing', 'safety_rule_violation', 'threat_coercion', 'illicit_relationships', 'handbook_anti_life', 'bomb_threat', 'unauthorized_class_disruption', 'intoxication_on_campus', 'cheating', 'data_privacy', 'school_property_damage', 'smoking_vaping', 'malicious_gossip', 'vandalism', 'libel_cyberlibel', 'dishonesty', 'self_harm', 'other', 'harassment', 'threat', 'violence', 'discrimination')
);
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_offense_classification_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_offense_classification_check
  CHECK (offense_classification IN ('pending', 'minor', 'major', 'not_applicable'));

-- Extra restriction: does not replace or broaden the existing owner INSERT policy.
DROP POLICY IF EXISTS "reports_named_pending_insert" ON public.reports;
CREATE POLICY "reports_named_pending_insert" ON public.reports
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = (SELECT auth.uid())
    AND anonymous = false
    AND offense_classification = 'pending'
    AND classification_note IS NULL
    AND classified_by IS NULL AND classified_at IS NULL
    AND severity IS NULL AND ai_severity IS NULL
    AND status = 'submitted'
  );

CREATE OR REPLACE FUNCTION public.enforce_reports_handbook_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.anonymous IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'Anonymous submissions are no longer supported. Reload the report form.';
    END IF;
    IF NEW.severity IS NOT NULL OR NEW.ai_severity IS NOT NULL THEN
      RAISE EXCEPTION 'Severity is no longer accepted. Reload the report form.';
    END IF;
    IF NEW.offense_classification IS DISTINCT FROM 'pending'
      OR NEW.classification_note IS NOT NULL
      OR NEW.classified_by IS NOT NULL OR NEW.classified_at IS NOT NULL THEN
      RAISE EXCEPTION 'New reports must await handbook assessment.';
    END IF;
    RETURN NEW;
  END IF;

  -- Never expose old anonymous reporters by flipping the stored flag.
  IF NEW.anonymous IS DISTINCT FROM OLD.anonymous
    OR NEW.reporter_id IS DISTINCT FROM OLD.reporter_id THEN
    RAISE EXCEPTION 'Reporter identity and the original anonymity setting cannot be changed.';
  END IF;
  IF NEW.severity IS DISTINCT FROM OLD.severity
    OR NEW.ai_severity IS DISTINCT FROM OLD.ai_severity THEN
    RAISE EXCEPTION 'Legacy severity is read-only. Use handbook classification.';
  END IF;

  IF NEW.offense_classification IS DISTINCT FROM OLD.offense_classification
    OR NEW.classification_note IS DISTINCT FROM OLD.classification_note THEN
    -- Existing staff status permissions remain unchanged. New classification decisions
    -- are restricted to admin accounts used by authorized discipline personnel.
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only an authorized admin can record a handbook classification.';
    END IF;
    NEW.classification_note := nullif(btrim(NEW.classification_note), '');
    IF NEW.classification_note IS NULL OR length(NEW.classification_note) > 2000 THEN
      RAISE EXCEPTION 'A review explanation of 1 to 2000 characters is required.';
    END IF;
    NEW.classified_by := auth.uid();
    NEW.classified_at := clock_timestamp();
    NEW.updated_at := now();
  ELSE
    -- Clients cannot forge review attribution without an actual reviewed change.
    NEW.classified_by := OLD.classified_by;
    NEW.classified_at := OLD.classified_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_handbook_guard ON public.reports;
CREATE TRIGGER reports_handbook_guard
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_reports_handbook_submission();

COMMENT ON COLUMN public.reports.severity IS 'Historical values only; new reports have no severity.';
COMMENT ON COLUMN public.reports.ai_severity IS 'Historical model output only; not a handbook classification.';
COMMENT ON COLUMN public.reports.offense_classification IS 'Manual discipline classification; not a finding of guilt or an automatic sanction.';
COMMIT;
