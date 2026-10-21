-- V140 introduced project_template_college as a strictly opt-in assignment table -- by design,
-- no row means "not assigned," and V140 itself deliberately inserted nothing. That default is
-- correct going forward (new templates should be invisible until a super-admin chooses to
-- publish them to a college), but it is wrong applied retroactively: V136 stopped the
-- application from reading project_template.college_id for visibility at all, so any template
-- created back when college-admins had direct template CRUD (pre-V136) would silently vanish
-- from that same college's own catalog the moment this migration series lands, with no error and
-- no record of why. On dev-2026 this was a non-issue (V136's own comment confirms dev had no
-- live templates when it ran), but a long-lived environment can easily have real, college-authored
-- templates from before the global-catalog change -- exactly the environment this migration
-- protects.
--
-- One-time backfill: for every non-deleted template that still carries its original (pre-V136)
-- college_id, grant that same college an explicit assignment row, so nothing a college could see
-- yesterday disappears today. Templates already re-scoped to global-only (college_id NULL, e.g.
-- everything created after V136 on an environment where this already ran) are correctly left
-- alone -- there is no prior "owning college" to preserve for those.
--
-- Idempotent: INSERT IGNORE against project_template_college's own UNIQUE KEY
-- (template_id, college_id) means a template already explicitly (re)assigned -- whether by this
-- same migration on a prior run, or by a super-admin's own action after V140 -- is left
-- untouched rather than overwritten or duplicated.
INSERT IGNORE INTO project_template_college (template_id, college_id, assigned_by, created_at)
SELECT id, college_id, created_by, NOW()
FROM project_template
WHERE college_id IS NOT NULL
  AND is_deleted = FALSE;
