-- Keep PAP interest private to the college-scoped candidate preference.
ALTER TABLE placement_candidate_preferences
 ADD COLUMN pap_interest varchar(20);
--> statement-breakpoint
ALTER TABLE placement_candidate_preferences ADD CONSTRAINT placement_candidate_preferences_pap_ck
 CHECK (pap_interest IS NULL OR pap_interest IN ('YES','NO','NEED_MORE_INFO'));
