-- REGISTER WITH ORCHESTRATOR BEFORE ENABLING 169–8760 HOURS IN ATTENDANCE POLICY UI.
ALTER TABLE attendance_policies DROP CONSTRAINT IF EXISTS attendance_policies_correction_window_ck;
ALTER TABLE attendance_policies ADD CONSTRAINT attendance_policies_correction_window_ck
 CHECK(correction_window_hours BETWEEN 1 AND 8760);
-- No user data transformation. Compatible with all existing stored values.
