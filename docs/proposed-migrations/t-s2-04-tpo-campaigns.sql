-- T-S2-04 STAGED ONLY. DO NOT RUN AS A LANE MIGRATION.
-- Orchestrator: reconcile DB10 recipient privacy, journal, snapshot, FK and RLS,
-- test in disposable PostgreSQL and approve an authorized sending worker.
create table placement_tpo_email_campaigns (
 id uuid primary key default gen_random_uuid(),
 college_id uuid not null references colleges(id) on delete restrict,
 created_by_user_id uuid not null references users(id) on delete restrict,
 status varchar(16) not null default 'DRAFT'
   check (status in ('DRAFT','SENDING','SENT','CANCELLED')),
 total_recipients integer not null default 0
   check(total_recipients between 0 and 500),
 created_at timestamptz not null default now(),
 unique(college_id,id)
);
create index tpo_email_campaign_college_created_idx
 on placement_tpo_email_campaigns(college_id,created_at);
create table placement_tpo_email_campaign_recipients (
 id uuid primary key default gen_random_uuid(),
 college_id uuid not null,
 campaign_id uuid not null,
 lead_id uuid not null,
 recipient_key varchar(64) not null check(recipient_key ~ '^[0-9a-f]{64}$'),
 status varchar(24) not null default 'PENDING'
  check(status in ('PENDING','SKIPPED_NO_EMAIL','SKIPPED_UNSUBSCRIBED',
    'QUEUED','SENT','FAILED','UNSUBSCRIBED')),
 unsubscribed_at timestamptz,
 sent_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(college_id,campaign_id) references
  placement_tpo_email_campaigns(college_id,id) on delete restrict,
 foreign key(college_id,lead_id) references
  placement_tpo_leads(college_id,id) on delete restrict,
 unique(campaign_id,lead_id),
 -- Stop duplicate provider sends when different leads normalize to the same email.
 unique(campaign_id,recipient_key)
);
create index tpo_email_recipient_college_campaign_idx
 on placement_tpo_email_campaign_recipients(college_id,campaign_id);
-- No campaign dispatch route is enabled by this proposal.
-- Cross-row max-500 must be transactionally enforced by a campaign row lock,
-- not just total_recipients. Verify recipient suppression immediately before send,
-- record provider acceptance (not mailbox delivery), and audit every event.

-- Orchestrator review: recipient_key must be the keyed HMAC of a normalized
-- email with a service secret separate from invitation and global opt-out keys.
-- Do not activate the delivery route until worker retries, concurrency, global
-- suppression, consent, and immutable EMAIL activity audits have PG acceptance.
