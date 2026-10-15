-- PR-S2-08 staged only; no registered migration or live enforcement yet.
ALTER TABLE project_members ADD COLUMN role_kind varchar(24),
  ADD COLUMN can_mutate boolean;
UPDATE project_members SET role_kind=CASE WHEN role='MENTOR' THEN 'MENTOR' ELSE 'LEARNER' END,
  can_mutate=true WHERE role_kind IS NULL;
ALTER TABLE project_members ALTER COLUMN role_kind SET NOT NULL,
  ALTER COLUMN can_mutate SET NOT NULL;
ALTER TABLE project_members ADD CONSTRAINT project_members_role_kind_ck CHECK (
  role_kind IN ('LEARNER','MENTOR','CO_MENTOR','OBSERVER','REVIEWER','QA'));
ALTER TABLE project_members ADD CONSTRAINT project_members_readonly_role_ck CHECK (
  role_kind NOT IN ('OBSERVER','REVIEWER','QA') OR can_mutate=false);
-- Before promoting: refactor requireProjectLifecycleAccess to honor can_mutate,
-- admit assigned read-only observers without opening tenant scope, update member
-- mutation DTOs and audit legacy role-mapping decisions.
