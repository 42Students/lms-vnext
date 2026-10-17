-- Proposal SA-placements-projects-27/28. Orchestrator registers numbered SQL.
CREATE TABLE placement_company_domains (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES placement_companies(id),
 domain varchar(253) NOT NULL,
 added_by_user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX placement_company_domains_lower_domain_uq ON placement_company_domains(lower(domain));
CREATE INDEX placement_company_domains_company_idx ON placement_company_domains(company_id);
INSERT INTO placement_company_domains(company_id,domain,added_by_user_id)
 SELECT id,lower(primary_domain),created_by_user_id FROM placement_companies
 WHERE primary_domain IS NOT NULL ON CONFLICT DO NOTHING;
CREATE TABLE placement_company_aliases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES placement_companies(id),
 alias varchar(160) NOT NULL,
 added_by_user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX placement_company_aliases_lower_alias_uq ON placement_company_aliases(lower(alias));
CREATE INDEX placement_company_aliases_company_idx ON placement_company_aliases(company_id);
