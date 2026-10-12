-- DB-017 semantic-only schema alignment.
-- FILE remains rejected by assignment_submissions_payload_ck until DB053.
ALTER TYPE "public"."assignment_submission_type" ADD VALUE 'FILE';--> statement-breakpoint
