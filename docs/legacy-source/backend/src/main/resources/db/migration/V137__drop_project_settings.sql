-- project_settings (created V92) was never wired to anything: no controller ever read or wrote
-- it, ProjectSettingsRepository was injected into ProjectWorkspaceServiceImpl but never actually
-- called. Its one field that describes real behavior (require_mentor_before_active) was
-- superseded by a hardcoded, unconditional rule in code (see
-- ProjectWorkspaceServiceImpl#requireMentorBeforeActive) with no per-college opt-out; the other
-- three (default_template_id, allow_learner_self_enroll, auto_archive_after_days) never had any
-- feature built against them at all. Confirmed via the Projects-module edge-case audit
-- (PROJECTS-MODULE-EXHAUSTIVE-AUDIT-2026-09-05.md, finding P1) that nothing in the codebase reads
-- this table, so dropping it removes dead schema rather than losing configured behavior.
DROP TABLE IF EXISTS project_settings;
