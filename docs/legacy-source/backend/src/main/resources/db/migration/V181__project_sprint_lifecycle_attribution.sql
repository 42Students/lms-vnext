-- Sprint lifecycle attribution. The sprint detail window could only say "Last updated by X" from
-- the generic updated_by column, because nothing recorded who actually started or completed a
-- sprint (any later edit overwrote it). Same pattern as project_task.submitted_by/submitted_at
-- (V174): dedicated lifecycle columns, written only by startSprint / completeSprint.
-- Times are UTC, like every other server-written LocalDateTime.
ALTER TABLE project_sprint
    ADD COLUMN started_by INT NULL AFTER updated_by,
    ADD COLUMN started_at DATETIME NULL AFTER started_by,
    ADD COLUMN completed_by INT NULL AFTER started_at,
    ADD COLUMN completed_at DATETIME NULL AFTER completed_by;
