-- Databases migrated before 0057 gained login_methods (dev applied 0057 earlier)
-- need the column before reading it; 0277 then only adds the check constraint.
ALTER TABLE college_branding ADD COLUMN IF NOT EXISTS login_methods varchar(32);
--> statement-breakpoint
-- Existing branding preferences and current auth policy are distinct.
-- Explicit historical values are normalized once; nullable values inherit
-- the current email-first default and do not manufacture a saved policy.
-- This is greenfield: no external legacy database is read by this migration.
INSERT INTO college_signin_policies(college_id,method,version,updated_at)
SELECT b.college_id,
 CASE b.login_methods
  WHEN 'EMAIL_PHONE' THEN 'EMAIL_AND_PHONE'
  WHEN 'PHONE_EMAIL' THEN 'PHONE_AND_EMAIL'
  ELSE b.login_methods END,
 0,clock_timestamp()
FROM college_branding b
JOIN colleges c ON c.id=b.college_id AND c.status='ACTIVE'
WHERE b.login_methods IS NOT NULL
ON CONFLICT(college_id) DO NOTHING;
