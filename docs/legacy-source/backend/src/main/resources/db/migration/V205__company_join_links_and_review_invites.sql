-- Recruiter phase 1, step 6 (N5 b, c).
-- (b) A unique link per company the college is engaging: anyone with a proven email on that company's domain can join this
--     college through it. The college tracks opens and joins, and can mark the company trusted: a trusted company's drives
--     go live without the placement cell's review.
ALTER TABLE college_company
    ADD COLUMN trusted TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN join_token_hash CHAR(64) NULL,
    ADD COLUMN join_link_created_at DATETIME NULL,
    ADD COLUMN join_link_opens INT NOT NULL DEFAULT 0,
    ADD COLUMN join_link_joins INT NOT NULL DEFAULT 0,
    ADD KEY idx_college_company_join_token (join_token_hash);

-- (c) The placement cell posts a drive and invites the recruiter to review it: the drive waits for that person.
ALTER TABLE recruiter_lead ADD COLUMN review_job_id INT NULL;
