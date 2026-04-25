UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE id = '327331cd-2fa2-4186-9b4b-ca61c1aee0b0';

INSERT INTO public.profiles (id, email, full_name)
VALUES ('327331cd-2fa2-4186-9b4b-ca61c1aee0b0', 'neotopia_admin@neotopia.com', 'neotopia_admin')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

INSERT INTO public.user_roles (user_id, role)
VALUES ('327331cd-2fa2-4186-9b4b-ca61c1aee0b0', 'platform_admin')
ON CONFLICT (user_id, role) DO NOTHING;