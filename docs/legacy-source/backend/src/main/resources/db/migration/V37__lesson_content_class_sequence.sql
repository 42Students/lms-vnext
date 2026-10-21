-- Per-class sequence overrides: when admin reorders contents for a class, only that class sees the new order.
-- Generic content default order is unchanged for other classes.
CREATE TABLE lesson_content_class_sequence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_content_id INT NOT NULL,
    class_id INT NOT NULL,
    sequence BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY unique_content_class (lesson_content_id, class_id),
    KEY idx_lccs_lesson_content (lesson_content_id),
    KEY idx_lccs_class (class_id)
);
