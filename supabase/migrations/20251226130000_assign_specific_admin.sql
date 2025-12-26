-- Assign admin role to redsparks184@gmail.com
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user properly from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'redsparks184@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Remove valid existing roles to ensure we have a clean slate (idempotency)
    DELETE FROM public.user_roles WHERE user_id = target_user_id;

    -- Assign the admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin');
  END IF;
END $$;
