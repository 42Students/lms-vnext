-- PROPOSED ONLY. Orchestrator registers after independent review and disposable PG replay.
-- No plaintext recipient, variables, provider authorization or invitation URL.
create table if not exists messaging_delivery_batches (
 id uuid primary key,
 organization_id uuid not null references organizations(id),
 college_id uuid not null references colleges(id),
 actor_user_id uuid not null references users(id),
 purpose varchar(160) not null,
 total integer not null check(total>=0 and total<=500),
 queued integer not null default 0 check(queued>=0),
 sent integer not null default 0 check(sent>=0),
 failed integer not null default 0 check(failed>=0),
 suppressed integer not null default 0 check(suppressed>=0),
 created_at timestamptz not null default now(),
 finalized_at timestamptz,
 constraint messaging_batch_count_ck check (queued+sent+failed+suppressed<=total)
);
create index if not exists messaging_batches_scope_idx
 on messaging_delivery_batches(college_id,created_at);
create table if not exists messaging_delivery_receipts (
 id uuid primary key,
 batch_id uuid not null references messaging_delivery_batches(id) on delete restrict,
 recipient_key varchar(64) not null check(recipient_key ~ '^[a-f0-9]{64}$'),
 channel varchar(16) not null check(channel in ('EMAIL','SMS')),
 template_key varchar(160) not null,
 purpose varchar(160) not null,
 status varchar(16) not null check(status in ('QUEUED','SENT','FAILED','SUPPRESSED')),
 reason varchar(64) check(reason in ('nonprod-not-allowlisted','unsubscribed','rate-limited','daily-cap','invalid-recipient')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(batch_id,recipient_key,channel,template_key,purpose)
);
create index if not exists messaging_receipts_batch_idx
 on messaging_delivery_receipts(batch_id,status);
-- Approval prerequisites: enforce same-college organization FK, writer row-security
-- privileges, serialized recipient/daily caps, and one activity_events audit event
-- per finalized batch. No web process may dispatch solely from these receipts.
