-- TPO-inbox-team-16 / TPO-companies-05 / TPO-inbox-team-18
-- PROPOSAL ONLY: the orchestrator registers a numbered Drizzle migration.
-- One durable private-to-the-college, whole-TPO-thread per company relationship.
-- Do not grant any access to company/recruiter accounts.
CREATE TABLE IF NOT EXISTS placement_tpo_company_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 relationship_id uuid NOT NULL,
 created_by_membership_id uuid NOT NULL,
 topic varchar(200) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_company_threads_college_relationship_fk FOREIGN KEY
  (relationship_id,college_id)
  REFERENCES placement_company_relationships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_company_threads_college_creator_fk FOREIGN KEY
  (created_by_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_company_threads_topic_ck CHECK (length(btrim(topic)) BETWEEN 1 AND 200),
 CONSTRAINT tpo_company_threads_one_per_relationship_uq UNIQUE (college_id,relationship_id),
 CONSTRAINT tpo_company_threads_id_college_uq UNIQUE (id,college_id)
);
CREATE INDEX IF NOT EXISTS tpo_company_threads_college_created_idx
 ON placement_tpo_company_threads(college_id,created_at DESC);

CREATE TABLE IF NOT EXISTS placement_tpo_company_thread_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id uuid NOT NULL,
 college_id uuid NOT NULL,
 author_membership_id uuid NOT NULL,
 body text NOT NULL,
 idempotency_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_company_message_thread_college_fk FOREIGN KEY
  (thread_id,college_id)
  REFERENCES placement_tpo_company_threads(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_company_message_author_college_fk FOREIGN KEY
  (author_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_company_message_body_ck CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
 CONSTRAINT tpo_company_message_dedupe_uq UNIQUE (thread_id,author_membership_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS tpo_company_message_thread_history_idx
 ON placement_tpo_company_thread_messages(thread_id,created_at DESC,id DESC);
