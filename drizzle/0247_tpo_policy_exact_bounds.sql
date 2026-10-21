-- [chat-14] Exact legacy bounds; migration requires incompatible-row preflight.
ALTER TABLE placement_college_rules
  DROP CONSTRAINT placement_college_rules_bounds_ck;
--> statement-breakpoint
ALTER TABLE placement_college_rules ADD CONSTRAINT placement_college_rules_bounds_ck
  CHECK(max_held_offers BETWEEN 1 AND 5
    AND uplift_pct BETWEEN 0 AND 200
    AND min_response_hours BETWEEN 12 AND 168
    AND version >= 0);
