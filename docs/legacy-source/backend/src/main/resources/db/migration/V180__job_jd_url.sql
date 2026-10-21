-- The job description as a file (PDF or Word), uploaded by the placement cell or the recruiter, shown to students as a link.
ALTER TABLE job
    ADD COLUMN jd_url VARCHAR(500) NULL COMMENT 'Link to the uploaded job description file';
