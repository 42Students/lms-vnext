-- The top bar asks every 30 seconds how many recruiter messages are unread. This lets that count read only the unread rows of each thread.
CREATE INDEX idx_tpo_message_unread ON tpo_message (thread_id, sender_type, read_at);
