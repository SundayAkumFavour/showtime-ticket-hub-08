-- Promote the specific user to admin role
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'redsparks184@gmail.com'
);
