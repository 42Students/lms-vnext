-- DB03 project-team roster link; legacy V191 parity.
ALTER TABLE "project_instances" ADD COLUMN "team_group_id" uuid;
--> statement-breakpoint
ALTER TABLE "project_instances" ADD CONSTRAINT "project_instances_team_group_id_lms_groups_id_fk" FOREIGN KEY ("team_group_id") REFERENCES "public"."lms_groups"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "project_instances_team_group_uq" ON "project_instances" USING btree ("team_group_id");
