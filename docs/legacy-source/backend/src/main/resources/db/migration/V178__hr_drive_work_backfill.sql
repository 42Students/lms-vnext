-- V165 gave DRIVE_WORK to every recruiter who could request a drive, but grants made after V165 through the
-- admin path carried only the capabilities that were sent. A recruiter who may request a drive must be able
-- to open the drives they asked for (DRIVE_WORK only ever covers their own drives).
INSERT INTO hr_college_access_capability (access_id, capability)
SELECT c.access_id, 'DRIVE_WORK' FROM hr_college_access_capability c
WHERE c.capability = 'DRIVE_REQUEST'
  AND NOT EXISTS (SELECT 1 FROM hr_college_access_capability x WHERE x.access_id = c.access_id AND x.capability = 'DRIVE_WORK');
