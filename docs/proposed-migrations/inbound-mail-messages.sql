-- PROPOSED ONLY. Owner registers a numbered migration after reviewing inbound webhook identity,
-- signature verification, retention, private access, sender handling and PII policies.
-- This file is NOT executed and must not be copied into drizzle/ by this lane.
CREATE TABLE inbound_mail_messages (
 id uuid PRIMARY KEY,
 source_message_id varchar(255) NOT NULL UNIQUE,
 college_id uuid NULL REFERENCES colleges(id),
 from_address varchar(320) NOT NULL,
 to_address varchar(320) NOT NULL,
 subject varchar(512) NOT NULL,
 body_plain text NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','TRIAGED','RESOLVED')),
 received_at timestamptz NOT NULL,
 version integer NOT NULL DEFAULT 0 CHECK (version>=0)
);
CREATE INDEX inbound_mail_received_at ON inbound_mail_messages(received_at);
CREATE INDEX inbound_mail_college_status ON inbound_mail_messages(college_id,status);
-- No webhook ingestion or outbound reply endpoint is enabled by this proposal.
