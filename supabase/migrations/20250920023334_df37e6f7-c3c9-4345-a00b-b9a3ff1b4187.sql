-- Enable password strength checking and leaked password protection
UPDATE auth.config SET 
  password_min_length = 8,
  password_require_letters = true,
  password_require_numbers = true,
  password_require_symbols = true;

-- This will be handled by user in Supabase dashboard as it requires UI configuration