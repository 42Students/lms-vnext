-- TPO-batches-26: allow a college to retire a batch that was never invited.
-- Proposed only. Orchestrator owns registration and disposable-PostgreSQL replay.
-- Invitations remain unchanged; this does NOT fabricate invited_at.
ALTER TABLE placement_batch_lifecycles
 DROP CONSTRAINT IF EXISTS placement_batch_lifecycles_timeline_ck;
ALTER TABLE placement_batch_lifecycles
 ADD CONSTRAINT placement_batch_lifecycles_timeline_ck
 CHECK (finished_at IS NULL OR invited_at IS NULL OR finished_at >= invited_at);
