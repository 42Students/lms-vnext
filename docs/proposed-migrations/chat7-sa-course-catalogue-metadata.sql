-- SA-academics-people-50: selected-college course display metadata.
-- Existing catalogues retain their official internal code and original title.
-- These columns do not make private binaries uploadable.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_title varchar(120);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS official_code varchar(64);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS card_color varchar(7);
UPDATE courses SET short_title=left(name,120) WHERE short_title IS NULL;
ALTER TABLE courses ADD CONSTRAINT courses_card_color_hex_ck
 CHECK (card_color IS NULL OR card_color ~ '^#[0-9A-Fa-f]{6}$');
-- Avoid rewriting the existing non-null internal course code: that key is used
-- throughout offering/course integrations. Official code remains optional.
