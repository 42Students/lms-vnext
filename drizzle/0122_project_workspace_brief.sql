ALTER TABLE "project_instances" ADD COLUMN "authored_brief" jsonb DEFAULT '{"goal":"","description":"","deliverables":[],"completionConditions":[],"personas":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_authored_brief_shape_ck" CHECK (jsonb_typeof("project_instances"."authored_brief") = 'object');
