-- W01 forward-only DB09/DB-012 relationship disclosure-default parity.
-- Only this vetted additive field/check is registered; generated broad 0043 DDL
-- with table creation, enum changes and dropped/replaced checks remains UNAPPROVED.
-- No production data migration is required for greenfield vNext.
ALTER TABLE "placement_company_relationships" ADD COLUMN "share_column_defaults" jsonb;--> statement-breakpoint
ALTER TABLE "placement_company_relationships" ADD CONSTRAINT "placement_company_relationships_share_columns_ck" CHECK ("placement_company_relationships"."share_column_defaults" is null
or (
jsonb_typeof("placement_company_relationships"."share_column_defaults") = 'array'
and "placement_company_relationships"."share_column_defaults" <@
'["name","roll","branch","cgpa","tenth","twelfth","email","phone","resume","projects","skillMatch","stage"]'::jsonb
));--> statement-breakpoint
