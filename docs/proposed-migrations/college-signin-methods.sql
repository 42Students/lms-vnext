-- PROPOSED ONLY. Auth/security owner must register and validate before any runtime use.
-- No changes to src/auth, src/modules/auth, src/security or drizzle are part of this proposal.
CREATE TABLE college_signin_policies (
 college_id uuid PRIMARY KEY REFERENCES colleges(id),
 method varchar(32) NOT NULL CHECK (method IN
  ('EMAIL_AND_PHONE','PHONE_AND_EMAIL','EMAIL_ONLY','PHONE_ONLY')),
 version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Historical login identifiers and credential availability must be
-- validated before enabling EMAIL_ONLY or PHONE_ONLY. Do not apply
-- existing college policy as an authentication override by implication.
