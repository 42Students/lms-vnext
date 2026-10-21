-- Learner progress for consumable content (video, etc.): position, duration, completed.
-- One row per (learner_id, lesson_content_id). Future-proof for other content types (e.g. PDF page).
CREATE TABLE learner_content_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    lesson_content_id INT NOT NULL,
    last_position_seconds INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 0,
    completed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY unique_learner_lesson_content (learner_id, lesson_content_id),
    KEY idx_learner_content_progress_learner (learner_id),
    KEY idx_learner_content_progress_lesson_content (lesson_content_id)
);
