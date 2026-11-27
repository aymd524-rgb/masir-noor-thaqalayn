-- Prevent authenticated users from self-assigning privileged profile fields.
-- Role changes are routed through an admin-only SECURITY DEFINER RPC.

REVOKE INSERT ON TABLE public.profiles FROM authenticated;
GRANT INSERT (id, full_name, phone) ON TABLE public.profiles TO authenticated;

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone) ON TABLE public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_profile_role(
  p_user_id uuid,
  p_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'admin access required' USING errcode = '42501';
  END IF;

  IF p_user_id IS NULL OR p_role NOT IN ('student', 'teacher', 'admin') THEN
    RAISE EXCEPTION 'invalid user or role' USING errcode = '22023';
  END IF;

  UPDATE public.profiles
  SET role = p_role
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_profile_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_role(uuid, text) TO authenticated;
