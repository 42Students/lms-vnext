-- Bound legacy display names on all write paths. Archived departments
-- remain referentially intact, and active uniqueness is college scoped.
ALTER TABLE departments ADD CONSTRAINT departments_legacy_name_length_ck
 CHECK (length(trim(name)) BETWEEN 1 AND 255);
