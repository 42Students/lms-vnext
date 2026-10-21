-- The bell was read for the whole placement team at once: one person opening a notification cleared it for everyone.
-- Each person now has their own read state. A reader is (type, id) because faculty and admin ids can overlap.
-- tpo_bell.read_at stays for rows read before this (they count as read for everyone).
CREATE TABLE tpo_bell_read (
    bell_id BIGINT NOT NULL,
    reader_type VARCHAR(20) NOT NULL,
    reader_id INT NOT NULL,
    read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bell_id, reader_type, reader_id),
    INDEX idx_tpo_bell_read_reader (reader_type, reader_id, bell_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
