-- SEC-06-011/012: separate the migration owner from the runtime role. OWNER-GATED.
-- Run by a human as a cloudsqlsuperuser on the DEV database first (lms_vnext), reviewed, never from automation.
-- Passwords are set out of band; no secret appears here. Roll back with the commented block at the end.
BEGIN;
CREATE ROLE lms_vnext_migrator LOGIN NOSUPERUSER NOCREATEROLE NOCREATEDB NOBYPASSRLS;
-- (set its password out of band, store it in the migrator secret)
GRANT lms_vnext_migrator TO cloudsqlsuperuser;  -- lets the superuser run the REASSIGN below
REASSIGN OWNED BY lms_vnext_app TO lms_vnext_migrator;
ALTER ROLE lms_vnext_app NOCREATEROLE NOCREATEDB NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO lms_vnext_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lms_vnext_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lms_vnext_app;
ALTER DEFAULT PRIVILEGES FOR ROLE lms_vnext_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lms_vnext_app;
ALTER DEFAULT PRIVILEGES FOR ROLE lms_vnext_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO lms_vnext_app;
-- Runtime must not truncate, alter or own anything:
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM lms_vnext_app;
COMMIT;
-- After this: point the migrator Job at lms_vnext_migrator's secret; the web Deployment keeps lms_vnext_app.
-- Verify: node scripts/security/pg-rls-readonly-audit.mjs --strict   (with the runtime DATABASE_URL)
-- Rollback (superuser): REASSIGN OWNED BY lms_vnext_migrator TO lms_vnext_app; ALTER ROLE lms_vnext_app CREATEROLE CREATEDB;
