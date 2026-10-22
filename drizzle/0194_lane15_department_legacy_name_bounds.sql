-- Bound legacy display names on all write paths. Archived departments
-- remain referentially intact, and active uniqueness is college scoped.
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE departments ADD CONSTRAINT departments_legacy_name_length_ck
 CHECK (length(trim(name)) BETWEEN 1 AND 255)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
