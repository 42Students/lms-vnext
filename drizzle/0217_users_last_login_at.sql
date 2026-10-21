-- [chat-14] Historic successful login timestamp; the login writer remains a separate service task.
ALTER TABLE users ADD COLUMN last_login_at timestamptz;
