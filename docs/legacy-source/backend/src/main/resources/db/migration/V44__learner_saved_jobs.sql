-- 8.5 / 21.2.6: Saved jobs - learner bookmark for later
CREATE TABLE IF NOT EXISTS learner_saved_job (
  id INT AUTO_INCREMENT PRIMARY KEY,
  learner_id INT NOT NULL,
  job_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_learner_job (learner_id, job_id),
  KEY idx_learner (learner_id),
  KEY idx_job (job_id)
);
