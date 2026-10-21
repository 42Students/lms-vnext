-- Sprints only exist inside a release now -- no more "sprint ships independently" state. Audited
-- ahead of this migration: exactly 2 of 146 existing sprints (across 121 releases, 3 projects) had
-- no release_id, both junk manual-test rows on project 2 with gibberish titles ("ABC" and
-- "hjbkljhcgvjkl;jhvj"), neither ever touched by a real user (this module has no real traffic
-- yet). Deleting them outright rather than backfilling a release for them, since there is no real
-- release they were ever meant to belong to.
DELETE FROM project_sprint WHERE release_id IS NULL;

-- Now that every row satisfies it, make the rule a real constraint rather than an
-- application-layer convention a future write path could quietly skip.
ALTER TABLE project_sprint MODIFY COLUMN release_id INT NOT NULL;

-- No template schema change needed: a template's sprints already carry releaseKey/releaseLabel
-- (see ProjectWorkspaceServiceImpl.seedReleasesFromTemplate, which has derived a project's real
-- release ladder from exactly those two sprint fields since V119/#7 -- it just wasn't being
-- validated as REQUIRED, and the template editor's UI only ever exposed releaseLabel, not
-- releaseKey). Fixed at the application layer: validateTemplateSectionRows now rejects a template
-- sprint with no releaseKey, and the SPRINT_FIELDS form config gained the missing input.
