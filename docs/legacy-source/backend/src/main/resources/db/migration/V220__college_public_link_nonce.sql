-- V220: college public link nonce
-- Idempotent where practical; rehearse against a copy of the target database first.


-- The college's public link can be shown again and put in drive invitations (docs/recruiter-global/
-- PUBLIC-LINK-AND-RECRUITER-RULES-AUDIT-2026-10-13.md). The link is HMAC(server secret, college + nonce): the server rebuilds it, a copy of
-- the database alone cannot. NULL: a link made before this change (V220); it keeps working but can't be shown until a new one is made.
ALTER TABLE college_public_link ADD COLUMN link_nonce VARCHAR(64) NULL;
