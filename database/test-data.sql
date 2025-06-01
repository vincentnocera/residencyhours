-- Insert test user profile for development
-- This matches the MOCK_USER_ID in src/services/auth.ts

INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name, 
  role, 
  program_id
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'resident@example.com',
  'Test',
  'Resident',
  'resident',
  '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT (id) DO NOTHING; 