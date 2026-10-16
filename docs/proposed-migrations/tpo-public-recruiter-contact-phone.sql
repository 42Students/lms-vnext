-- TPO-campaigns-public-R01 STAGED ONLY. Registration is orchestrator-owned.
-- Distinct from users.phone_e164, which is a first-party login factor.
CREATE TABLE placement_recruiter_public_contacts (
 recruiter_user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
 phone_digits varchar(10) NOT NULL CHECK(phone_digits ~ '^[0-9]{10}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Reader access must remain authenticated and college-grant scoped.
