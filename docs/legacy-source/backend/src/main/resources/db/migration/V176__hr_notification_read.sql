-- HR V2: the recruiter's notification bell is a feed derived from what the placement cell did on
-- their own drives plus messages from the cell. The only thing stored is how far they have read,
-- per recruiter and per college (a session belongs to one college).
CREATE TABLE hr_notification_read (
    hr_user_id BIGINT NOT NULL,
    college_id INT NOT NULL,
    read_through DATETIME NOT NULL,
    PRIMARY KEY (hr_user_id, college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
