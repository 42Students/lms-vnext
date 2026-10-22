-- [chat-14] Immutable legacy BaseModel creation timestamps for core tenancy.
-- Import local legacy wall-clock through parseLegacyLocalIstTimestamp before insert.
CREATE OR REPLACE FUNCTION prevent_core_created_at_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'created_at is immutable; use an audited correction workflow';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS organizations_immutable_created_at ON organizations;
--> statement-breakpoint
CREATE TRIGGER organizations_immutable_created_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION prevent_core_created_at_rewrite();
--> statement-breakpoint
DROP TRIGGER IF EXISTS departments_immutable_created_at ON departments;
--> statement-breakpoint
CREATE TRIGGER departments_immutable_created_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION prevent_core_created_at_rewrite();
