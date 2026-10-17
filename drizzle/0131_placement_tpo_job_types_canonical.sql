ALTER TABLE "placement_tpo_job_types" ADD COLUMN "counts_as_placed" boolean;--> statement-breakpoint
ALTER TABLE "placement_tpo_job_types" ADD COLUMN "is_builtin" boolean DEFAULT false NOT NULL;