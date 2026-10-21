-- V215: drive thread request lines
-- Idempotent where practical; rehearse against a copy of the target database first.

-- Change requests leave a line in the drive's company thread (kind = 'EVENT'), and a message can quote a request ("Discuss").
-- Event lines are not messages: they never count as unread, never make a thread "waiting", and are never emailed.
ALTER TABLE tpo_message
  ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'MESSAGE' COMMENT 'MESSAGE | EVENT (a change request line)',
  ADD COLUMN event VARCHAR(20) NULL COMMENT 'CREATED | ACCEPTED | ANSWERED | DECLINED | WITHDRAWN (kind = EVENT)',
  ADD COLUMN change_request_id BIGINT NULL COMMENT 'The request an event is about, or the request a message quotes';
