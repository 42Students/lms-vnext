-- Phase 5: Interview Scheduling System
-- Execute this SQL to create the interview table

CREATE TABLE interview (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  organization_id INT NOT NULL, -- Phase 5: Organization scoping
  job_id INT NOT NULL,
  job_application_id INT NOT NULL,
  learner_id INT NOT NULL,
  
  interview_type VARCHAR(50), -- SCREENING, TECHNICAL, HR, MANAGERIAL, FINAL
  interview_status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, CONFIRMED, RESCHEDULE_REQUESTED, COMPLETED, CANCELLED, NO_SHOW
  
  scheduled_date DATETIME NOT NULL,
  interview_mode VARCHAR(20), -- ONLINE, OFFLINE
  location VARCHAR(255), -- Physical location or meeting link
  notes TEXT, -- Optional notes
  
  created_by INT, -- User ID of admin who scheduled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (job_id) REFERENCES job(id),
  FOREIGN KEY (job_application_id) REFERENCES job_application(id),
  FOREIGN KEY (learner_id) REFERENCES learner(id),
  INDEX idx_interview_org (organization_id),
  INDEX idx_interview_job (job_id),
  INDEX idx_interview_application (job_application_id),
  INDEX idx_interview_learner (learner_id)
);


