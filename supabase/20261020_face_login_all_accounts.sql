-- Enable optional face-login enrollment for any account with a profile,
-- confirmed email, password, and no verified MFA factor.
-- Run as postgres in the Supabase SQL Editor after 20261019_face_login_pilot.sql.
-- The pilot allowlist table is retained, but is no longer used for eligibility.
BEGIN;

CREATE OR REPLACE FUNCTION public.face_login_account(p_email text)
RETURNS TABLE(user_id uuid, identity_stamp text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id, md5(coalesce(u.encrypted_password, '') || ':' || lower(u.email))
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE lower(u.email) = lower(p_email)
    AND u.email_confirmed_at IS NOT NULL
    AND coalesce(u.encrypted_password, '') <> ''
    AND (u.banned_until IS NULL OR u.banned_until < now())
    AND NOT EXISTS (
      SELECT 1
      FROM auth.mfa_factors f
      WHERE f.user_id = u.id AND f.status = 'verified'
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.face_login_account(text)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.face_login_account(text) TO service_role;

COMMIT;
