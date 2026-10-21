-- Nothing recorded who actually conducted an interview round — only feedbackSubmittedBy, which
-- may be a different admin. Free-text so a panel can be listed as "A, B" without needing a new
-- join entity for this pass.
ALTER TABLE interview ADD COLUMN interviewer_name VARCHAR(255) NULL AFTER location;
