-- Phase 3: Jobs Core System Tables
-- Execute this SQL directly in your database

-- Job Master Table
CREATE TABLE job (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_description TEXT,
  job_type VARCHAR(50), -- Internship, Full-time, PAP, Non-PAP
  
  location VARCHAR(255), -- Can be comma-separated for multiple locations
  
  eligibility_rules JSON, -- Stores eligibility criteria as JSON
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by INT NULL, -- Admin/Faculty ID (for future use)
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Job Application Table
CREATE TABLE job_application (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  learner_id INT NOT NULL,
  job_id INT NOT NULL,
  
  application_status VARCHAR(20) DEFAULT 'APPLIED', -- APPLIED, SHORTLISTED, REJECTED, SELECTED
  
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  UNIQUE KEY unique_learner_job (learner_id, job_id),
  FOREIGN KEY (learner_id) REFERENCES learner(id),
  FOREIGN KEY (job_id) REFERENCES job(id)
);


