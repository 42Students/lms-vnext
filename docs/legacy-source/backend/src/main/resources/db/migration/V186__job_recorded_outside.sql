-- A drive that happened outside the platform (a company's own campus visit, a pool drive run elsewhere) can still be
-- recorded so its results and offers count. Such a drive is published without telling any student, needs no
-- application deadline or company link, and the placement cell adds the students who took part.
ALTER TABLE job
    ADD COLUMN recorded_outside TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Happened outside the platform; recorded by the placement cell';
