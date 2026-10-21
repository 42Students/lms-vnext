-- Finishes what V141/V142 started, for the one column that stores double-encoded JSON.
--
-- project_template_version.snapshot_json holds a JSON *string* whose contents are themselves
-- JSON, so its keys are escaped: the stored bytes are `\"milestoneKey\":`, not `"milestoneKey":`.
--
-- V141 could not match that (its pattern had no backslashes) and V142's attempt did not work
-- either: V142 built its UPDATE as a string and ran it through PREPARE, so the `\"` in its
-- literals was consumed by the *second* parse and arrived at REPLACE as a plain `"`. Hence this
-- third pass, written as direct statements with a single level of parsing, where '\\"' resolves
-- to the two characters \ and " exactly as intended.
--
-- Scoped to snapshot_json alone because a survey of every other JSON column on the project tables
-- found zero rows holding the escaped form -- only this one is double-encoded.
--
-- Idempotent: the WHERE clause matches only rows still carrying the old spelling, so a re-run
-- updates nothing.

UPDATE project_template_version
   SET snapshot_json = CAST(
         REPLACE(
           REPLACE(
             REPLACE(
               REPLACE(
                 REPLACE(
                   REPLACE(
                     REPLACE(
                       REPLACE(
                         REPLACE(CAST(snapshot_json AS CHAR),
                                 '\\"linkedMilestoneKey\\":', '\\"linkedSprintKey\\":'),
                         '\\"linkedMilestoneLabel\\":', '\\"linkedSprintLabel\\":'),
                       '\\"milestoneKey\\":', '\\"sprintKey\\":'),
                     '\\"milestoneId\\":', '\\"sprintId\\":'),
                   '\\"milestoneLabel\\":', '\\"sprintLabel\\":'),
                 '\\"milestoneStatus\\":', '\\"sprintStatus\\":'),
               '\\"milestones\\":', '\\"sprints\\":'),
             '\\"milestone\\":', '\\"sprint\\":'),
           '\\"milestone-', '\\"sprint-')
         AS JSON)
 WHERE snapshot_json IS NOT NULL
   AND CAST(snapshot_json AS CHAR) LIKE '%milestone%';
