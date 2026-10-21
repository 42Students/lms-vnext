-- The single shared city/state/pincode was ambiguous: students couldn't tell
-- whether it described their current or permanent address. Split it into two
-- explicit sets and carry the existing values forward as the current address,
-- since that's what the old combined field was shown next to on save.

ALTER TABLE learner
    ADD COLUMN current_city VARCHAR(255) NULL AFTER current_address,
    ADD COLUMN current_state VARCHAR(255) NULL AFTER current_city,
    ADD COLUMN current_pincode VARCHAR(20) NULL AFTER current_state,
    ADD COLUMN permanent_city VARCHAR(255) NULL AFTER permanent_address,
    ADD COLUMN permanent_state VARCHAR(255) NULL AFTER permanent_city,
    ADD COLUMN permanent_pincode VARCHAR(20) NULL AFTER permanent_state;

UPDATE learner
SET current_city = city,
    current_state = state,
    current_pincode = pincode
WHERE city IS NOT NULL OR state IS NOT NULL OR pincode IS NOT NULL;

ALTER TABLE faculty
    ADD COLUMN current_city VARCHAR(255) NULL AFTER current_address,
    ADD COLUMN current_state VARCHAR(255) NULL AFTER current_city,
    ADD COLUMN current_pincode VARCHAR(20) NULL AFTER current_state,
    ADD COLUMN permanent_city VARCHAR(255) NULL AFTER permanent_address,
    ADD COLUMN permanent_state VARCHAR(255) NULL AFTER permanent_city,
    ADD COLUMN permanent_pincode VARCHAR(20) NULL AFTER permanent_state;

UPDATE faculty
SET current_city = city,
    current_state = state,
    current_pincode = pincode
WHERE city IS NOT NULL OR state IS NOT NULL OR pincode IS NOT NULL;
