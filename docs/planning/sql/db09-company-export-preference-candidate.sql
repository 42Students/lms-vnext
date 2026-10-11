-- DB09 company export-column default preference.
-- STAGED ONLY: not registered and not executed.
--
-- Legacy V162 placed export_columns_json on global industry_company, but current
-- share links persist the actual per-share columns_json and current source has no
-- live reader/writer for the global field. In vNext, preserve a possible default
-- at the college-company relationship boundary so one college cannot influence
-- another college's sharing defaults for the same company.

ALTER TABLE placement_company_relationships
  ADD COLUMN share_column_defaults jsonb;

ALTER TABLE placement_company_relationships
  ADD CONSTRAINT placement_company_relationships_share_columns_ck
  CHECK (
    share_column_defaults IS NULL
    OR (
      jsonb_typeof(share_column_defaults) = 'array'
      AND share_column_defaults <@
        '["name","roll","branch","cgpa","tenth","twelfth","email","phone","resume","projects","skillMatch","stage"]'::jsonb
    )
  );

-- Acceptance before registration:
-- 1) same global company can have different defaults in two colleges;
-- 2) a college cannot mutate another college relationship;
-- 3) unknown values are DB-rejected; duplicates are normalized/rejected by the writer;
-- 4) actual tpo_share_link columns remain immutable per share and do not change
--    when the relationship default changes later.
