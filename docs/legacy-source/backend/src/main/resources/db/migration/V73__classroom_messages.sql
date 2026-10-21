CREATE TABLE IF NOT EXISTS classroom_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    course_id INT NOT NULL,
    class_id INT NOT NULL,
    sender_id INT NULL,
    sender_name VARCHAR(255) NULL,
    sender_role VARCHAR(64) NULL,
    message_text TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    INDEX idx_classroom_messages_scope (course_id, class_id, is_deleted, is_pinned, created_at)
);
