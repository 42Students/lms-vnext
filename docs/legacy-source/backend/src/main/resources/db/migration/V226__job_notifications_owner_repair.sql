-- Placement notifications ("Application Submitted", interview scheduled / confirmed / cancelled / reminder) were saved against the
-- student's whole class with no learner, so every classmate saw them as their own ("You have successfully applied for ...").
-- Found in the full test run, 15 Oct 2026; the senders now set the learner. This gives the existing rows their owner back.

-- From the application the notification is about.
UPDATE notification n
JOIN job_application a ON a.id = n.application_id
SET n.learner_id = a.learner_id
WHERE n.learner_id IS NULL AND n.application_id IS NOT NULL;

-- From the interview, through its application.
UPDATE notification n
JOIN interview i ON i.id = n.interview_id
JOIN job_application a ON a.id = i.job_application_id
SET n.learner_id = a.learner_id
WHERE n.learner_id IS NULL AND n.interview_id IS NOT NULL;

-- A placement notification that still has no owner cannot be shown to the right student; hide it from the class.
UPDATE notification
SET is_deleted = 1
WHERE learner_id IS NULL AND notification_type = 'JOB';
