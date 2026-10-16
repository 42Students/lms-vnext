CREATE TABLE "data_import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"source_system" varchar(40) DEFAULT 'LMS_LEGACY' NOT NULL,
	"source_label" varchar(120),
	"loader_version" varchar(40),
	"snapshot_sha256" varchar(64),
	"status" varchar(16) DEFAULT 'RUNNING' NOT NULL,
	"counts" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"rolled_back_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "data_import_batches_status_ck" CHECK ("data_import_batches"."status" in ('RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
	CONSTRAINT "data_import_batches_sha_ck" CHECK ("data_import_batches"."snapshot_sha256" is null or "data_import_batches"."snapshot_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "data_import_batches_lifecycle_ck" CHECK (("data_import_batches"."status" = 'RUNNING' and "data_import_batches"."finished_at" is null and "data_import_batches"."rolled_back_at" is null)
        or ("data_import_batches"."status" in ('COMPLETED', 'FAILED') and "data_import_batches"."finished_at" is not null and "data_import_batches"."rolled_back_at" is null)
        or ("data_import_batches"."status" = 'ROLLED_BACK' and "data_import_batches"."rolled_back_at" is not null))
);
--> statement-breakpoint
DROP INDEX "legacy_id_map_source_target_uq";--> statement-breakpoint
ALTER TABLE "legacy_id_map" ADD COLUMN "college_id" uuid;--> statement-breakpoint
ALTER TABLE "legacy_id_map" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "legacy_id_map" ADD COLUMN "source_system" varchar(40) DEFAULT 'LMS_LEGACY' NOT NULL;--> statement-breakpoint
ALTER TABLE "legacy_id_map" ADD COLUMN "source_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "data_import_batches" ADD CONSTRAINT "data_import_batches_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "data_import_batches_id_college_uq" ON "data_import_batches" USING btree ("id","college_id");--> statement-breakpoint
CREATE INDEX "data_import_batches_college_started_idx" ON "data_import_batches" USING btree ("college_id","started_at");--> statement-breakpoint
ALTER TABLE "legacy_id_map" ADD CONSTRAINT "legacy_id_map_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legacy_id_map" ADD CONSTRAINT "legacy_id_map_batch_college_fk" FOREIGN KEY ("batch_id","college_id") REFERENCES "public"."data_import_batches"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_id_map_college_source_target_uq" ON "legacy_id_map" USING btree ("college_id","source_system","legacy_entity_type","legacy_id","new_entity_type") WHERE "legacy_id_map"."college_id" is not null;--> statement-breakpoint
CREATE INDEX "legacy_id_map_batch_idx" ON "legacy_id_map" USING btree ("batch_id") WHERE "legacy_id_map"."batch_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_id_map_source_target_uq" ON "legacy_id_map" USING btree ("legacy_entity_type","legacy_id","new_entity_type") WHERE "legacy_id_map"."college_id" is null;--> statement-breakpoint
ALTER TABLE "legacy_id_map" ADD CONSTRAINT "legacy_id_map_batch_college_ck" CHECK ("legacy_id_map"."batch_id" is null or "legacy_id_map"."college_id" is not null);--> statement-breakpoint
ALTER TABLE "legacy_id_map" ADD CONSTRAINT "legacy_id_map_source_hash_ck" CHECK ("legacy_id_map"."source_hash" is null or "legacy_id_map"."source_hash" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
CREATE OR REPLACE FUNCTION data_import_batches_guard() RETURNS trigger AS $$
BEGIN
  IF NEW.college_id IS DISTINCT FROM OLD.college_id
     OR NEW.source_system IS DISTINCT FROM OLD.source_system
     OR NEW.started_at IS DISTINCT FROM OLD.started_at THEN
    RAISE EXCEPTION 'data_import_batches college_id, source_system and started_at are immutable';
  END IF;
  IF OLD.status IN ('FAILED', 'ROLLED_BACK') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'data_import_batches in status % is terminal', OLD.status;
  END IF;
  IF OLD.status = 'COMPLETED' AND NEW.status NOT IN ('COMPLETED', 'ROLLED_BACK') THEN
    RAISE EXCEPTION 'data_import_batches COMPLETED can only move to ROLLED_BACK';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER data_import_batches_guard_trg BEFORE UPDATE ON "data_import_batches"
  FOR EACH ROW EXECUTE FUNCTION data_import_batches_guard();--> statement-breakpoint
CREATE OR REPLACE FUNCTION legacy_id_map_batch_open_guard() RETURNS trigger AS $$
DECLARE batch_status varchar;
BEGIN
  IF NEW.batch_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.batch_id IS NOT DISTINCT FROM OLD.batch_id THEN
    RETURN NEW;
  END IF;
  SELECT status INTO batch_status FROM data_import_batches WHERE id = NEW.batch_id;
  IF batch_status IS DISTINCT FROM 'RUNNING' THEN
    RAISE EXCEPTION 'legacy_id_map rows can only be attached to a RUNNING import batch (batch % is %)', NEW.batch_id, batch_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER legacy_id_map_batch_open_guard_trg BEFORE INSERT OR UPDATE ON "legacy_id_map"
  FOR EACH ROW EXECUTE FUNCTION legacy_id_map_batch_open_guard();
