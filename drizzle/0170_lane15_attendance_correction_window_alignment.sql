-- Lane 15: existing schema permits 1..8760 correction hours but original 0033 SQL caps at 168.
-- Registered 0114 drops the old check without replacing it; restore the schema's 1..8760 guard. Do not rewrite migration 0033.
ALTER TABLE attendance_policies DROP CONSTRAINT IF EXISTS attendance_policies_correction_window_ck;
--> statement-breakpoint
ALTER TABLE attendance_policies ADD CONSTRAINT attendance_policies_correction_window_ck
 CHECK (correction_window_hours BETWEEN 1 AND 8760);
-- Human-facing limits, role authorization and correction audit remain service responsibilities.
