ALTER TABLE "project_members" ADD COLUMN "role_kind" varchar(24);--> statement-breakpoint
ALTER TABLE "project_members" ADD COLUMN "can_mutate" boolean;--> statement-breakpoint
UPDATE "project_members" SET "role_kind" = CASE WHEN "role" = 'MENTOR' THEN 'MENTOR' ELSE 'LEARNER' END, "can_mutate" = true WHERE "role_kind" IS NULL;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "role_kind" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ALTER COLUMN "can_mutate" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_role_kind_ck" CHECK ("project_members"."role_kind" in ('LEARNER','MENTOR','CO_MENTOR','OBSERVER','REVIEWER','QA'));--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_readonly_role_ck" CHECK ("project_members"."role_kind" not in ('OBSERVER','REVIEWER','QA') or "project_members"."can_mutate" = false);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION project_members_default_kind() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role_kind IS NULL THEN
    NEW.role_kind := CASE WHEN NEW.role = 'MENTOR' THEN 'MENTOR' ELSE 'LEARNER' END;
  END IF;
  IF NEW.can_mutate IS NULL THEN
    NEW.can_mutate := NEW.role_kind NOT IN ('OBSERVER','REVIEWER','QA');
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER project_members_default_kind_trg BEFORE INSERT ON "project_members"
  FOR EACH ROW EXECUTE FUNCTION project_members_default_kind();
