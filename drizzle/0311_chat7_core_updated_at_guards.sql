-- [chat-7] Preserve legacy BaseModel updatedAt on bulk SQL mutations.
-- Only change updated_at when the writer did not provide an explicit value.
CREATE OR REPLACE FUNCTION chat7_bump_updated_at_if_unchanged()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS chat7_organizations_updated_at ON organizations;
--> statement-breakpoint
CREATE TRIGGER chat7_organizations_updated_at
 BEFORE UPDATE ON organizations
 FOR EACH ROW EXECUTE FUNCTION chat7_bump_updated_at_if_unchanged();
--> statement-breakpoint
DROP TRIGGER IF EXISTS chat7_colleges_updated_at ON colleges;
--> statement-breakpoint
CREATE TRIGGER chat7_colleges_updated_at
 BEFORE UPDATE ON colleges
 FOR EACH ROW EXECUTE FUNCTION chat7_bump_updated_at_if_unchanged();
