-- W03 / DB07 staged SQL candidate only.
-- W01 owns registered Drizzle migrations, schema barrel changes and replay.
-- DO NOT add this directly to drizzle/** from W03.
--
-- Legacy oracle:
--   42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2
--
-- User jobs this candidate unlocks:
-- 1. College/Super Admin Readiness: Force Unlock / Force Block / Clear,
--    with note, actor and timestamp.
-- 2. At Risk: explicit workspace blocker as a third risk signal.
-- 3. Deleted Workspaces: recoverable soft deletion distinct from Archive.
--
-- vNext normalization:
-- - NULL readiness_override means no override.
-- - TRUE means force unlocked; FALSE means force blocked.
-- - deletion is workspace-level tombstoning; normalized child rows remain
--   intact but become unreachable/mutation-fenced while deleted. This
--   preserves exact restore semantics without independently soft-deleting
--   every normalized child table.
ALTER TABLE project_instances
  ADD COLUMN blocker text NULL,
  ADD COLUMN readiness_override boolean NULL,
  ADD COLUMN readiness_override_note text NULL,
  ADD COLUMN readiness_overridden_by_user_id uuid NULL
    REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN readiness_overridden_at timestamptz NULL,
  ADD COLUMN deleted_at timestamptz NULL,
  ADD COLUMN deleted_by_user_id uuid NULL
    REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN status_before_delete varchar(32) NULL;

ALTER TABLE project_instances
  ADD CONSTRAINT project_instances_readiness_override_shape_ck
  CHECK (
    (readiness_override IS NULL
      AND readiness_override_note IS NULL
      AND readiness_overridden_by_user_id IS NULL
      AND readiness_overridden_at IS NULL)
    OR
    (readiness_override IS NOT NULL
      AND readiness_overridden_by_user_id IS NOT NULL
      AND readiness_overridden_at IS NOT NULL)
  );

ALTER TABLE project_instances
  ADD CONSTRAINT project_instances_delete_shape_ck
  CHECK (
    (deleted_at IS NULL
      AND deleted_by_user_id IS NULL
      AND status_before_delete IS NULL)
    OR
    (deleted_at IS NOT NULL
      AND deleted_by_user_id IS NOT NULL
      AND status_before_delete IS NOT NULL)
  );

ALTER TABLE project_instances
  ADD CONSTRAINT project_instances_status_before_delete_ck
  CHECK (
    status_before_delete IS NULL
    OR status_before_delete IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED')
  );

-- Deleted workspaces must not permanently reserve the college slug.
DROP INDEX IF EXISTS project_instances_college_slug_uq;
CREATE UNIQUE INDEX project_instances_college_slug_active_uq
  ON project_instances(college_id, lower(slug))
  WHERE deleted_at IS NULL;

CREATE INDEX project_instances_deleted_idx
  ON project_instances(college_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX project_instances_readiness_override_idx
  ON project_instances(college_id, readiness_overridden_at DESC)
  WHERE readiness_override IS NOT NULL;

CREATE INDEX project_instances_blocker_idx
  ON project_instances(college_id, updated_at DESC)
  WHERE blocker IS NOT NULL AND length(trim(blocker)) > 0;

-- W01 replay/semantic tests required before promotion:
-- A. readiness override
--   1. null override requires all provenance columns null.
--   2. true/false override requires actor + timestamp.
--   3. wrong-tenant actor cannot write another college's override.
--   4. clearing override atomically clears note/actor/time.
--   5. once a final delivery is submitted, backend readiness rules still win
--      where legacy says manual execution override no longer changes the gate.
-- B. blockers
--   1. blank blocker is normalized to null at service boundary.
--   2. at-risk query includes nonblank blocker even with recent activity.
-- C. recoverable deletion
--   1. delete records previous status + actor + timestamp atomically.
--   2. every normal project query/access path requires deleted_at IS NULL.
--   3. deleted-workspaces page requires deleted_at IS NOT NULL.
--   4. restore clears tombstone atomically; legacy restore chooses ACTIVE when
--      a valid primary mentor exists and BLOCKED otherwise. vNext currently
--      has no BLOCKED project status, so W01/W03 must agree whether to add
--      BLOCKED or normalize that user-visible state separately before closure.
--   5. duplicate delete/restore requests are idempotent.
--   6. a deleted slug can be reused; restoring into a now-conflicting slug
--      must fail deterministically rather than violating uniqueness.
--
-- Cross-lane note: W06 owns shared audit/notification delivery. W03 services
-- should emit/hand off Project archive/delete/restore/override events through
-- the shared contract once W06 exposes it; do not duplicate an outbox here.
