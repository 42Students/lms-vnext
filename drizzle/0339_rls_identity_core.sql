-- Identity-core tenant policies (SEC-06-002/003). Inert unless app.rls_mode = enforce.
-- A recruiter is visible to a college only through a grant that college can see.
-- A person may always see their own college memberships (the workspace picker needs them before a college is chosen).
DROP POLICY IF EXISTS own_memberships ON "college_memberships";
--> statement-breakpoint
CREATE POLICY own_memberships ON "college_memberships" FOR SELECT USING (app_rls_bypass() OR "user_id" = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "colleges" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "colleges" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_identity ON "colleges";
--> statement-breakpoint
CREATE POLICY tenant_isolation_identity ON "colleges" USING (app_rls_bypass() OR "id" = nullif(current_setting('app.college_id', true), '')::uuid OR EXISTS (SELECT 1 FROM "college_memberships" AS m WHERE m."college_id" = "colleges"."id")) WITH CHECK (app_rls_bypass() OR "id" = nullif(current_setting('app.college_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "organizations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_identity ON "organizations";
--> statement-breakpoint
CREATE POLICY tenant_isolation_identity ON "organizations" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "colleges" AS c WHERE c."organization_id" = "organizations"."id")) WITH CHECK (app_rls_bypass());
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_identity ON "users";
--> statement-breakpoint
CREATE POLICY tenant_isolation_identity ON "users" USING (app_rls_bypass() OR "id" = nullif(current_setting('app.user_id', true), '')::uuid OR EXISTS (SELECT 1 FROM "college_memberships" AS m WHERE m."user_id" = "users"."id") OR EXISTS (SELECT 1 FROM "placement_recruiter_college_grants" AS g WHERE g."recruiter_user_id" = "users"."id")) WITH CHECK (app_rls_bypass() OR "id" = nullif(current_setting('app.user_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "membership_roles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "membership_roles" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation_derived ON "membership_roles";
--> statement-breakpoint
CREATE POLICY tenant_isolation_derived ON "membership_roles" USING (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "membership_roles"."membership_id")) WITH CHECK (app_rls_bypass() OR EXISTS (SELECT 1 FROM "college_memberships" AS p WHERE p."id" = "membership_roles"."membership_id"));
