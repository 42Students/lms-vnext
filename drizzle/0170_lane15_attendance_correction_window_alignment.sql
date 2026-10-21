-- Lane 15: existing schema permits 1..8760 correction hours but original 0033 SQL caps at 168.
-- Broaden DB constraint (up to 365 days) to match registered Drizzle schema; do not rewrite migration 0033.
ALTER TABLE attendance_policies DROP CONSTRAINT attendance_policies_correction_window_ck;
--> statement-breakpoint
ALTER TABLE attendance_policies ADD CONSTRAINT attendance_policies_correction_window_ck
 CHECK (correction_window_hours BETWEEN 1 AND 8760);
-- Human-facing limits, role authorization and correction audit remain service responsibilities.
