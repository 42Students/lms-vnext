-- notification.learner_id also held faculty ids (mentor notices from the projects module), and learners and faculty are numbered
-- separately: student #12 saw mentor #12's "You were assigned as mentor", and mentor #12's feed showed student #12's personal
-- notices (applications, interviews). Found in the full test run, 15 Oct 2026. recipient_type says whose id learner_id is.

ALTER TABLE notification ADD COLUMN recipient_type VARCHAR(10) NULL AFTER learner_id;

-- Every row that names someone was for a learner, except the mentor notices below.
UPDATE notification SET recipient_type = 'LEARNER' WHERE learner_id > 0;

-- Notices only ever sent to mentors (single and bulk reassignment, admin review on their behalf, a delivery to review).
UPDATE notification
SET recipient_type = 'FACULTY'
WHERE learner_id > 0 AND class_id = 0 AND notification_type = 'PROJECT'
  AND (title IN ('You were assigned as mentor', 'Removed as project mentor', 'Delivery reviewed by admin', 'Ready for review')
       OR title LIKE 'You were assigned as mentor for %'
       OR title LIKE 'Removed as mentor from %');

-- Sent to both learners and mentors: a faculty row is one whose number is a faculty member, and not a learner member, of a
-- project with that title (the notice carries the project title as its context label).
UPDATE notification n
SET n.recipient_type = 'FACULTY'
WHERE n.learner_id > 0 AND n.class_id = 0 AND n.notification_type = 'PROJECT'
  AND n.title IN ('Meeting requested', 'Removed from project')
  AND EXISTS (SELECT 1 FROM project_member m JOIN project_workspace p ON p.id = m.project_id
              WHERE m.user_id = n.learner_id AND m.user_type = 'FACULTY' AND p.title = n.context_label)
  AND NOT EXISTS (SELECT 1 FROM project_member m2 JOIN project_workspace p2 ON p2.id = m2.project_id
                  WHERE m2.user_id = n.learner_id AND m2.user_type = 'LEARNER' AND p2.title = n.context_label);
