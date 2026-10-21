ALTER TABLE notification
ADD COLUMN learner_id INT NULL AFTER course_id;

ALTER TABLE notification
ADD INDEX idx_notification_learner_id (learner_id);

ALTER TABLE notification
ADD INDEX idx_notification_class_course_learner (class_id, course_id, learner_id);
