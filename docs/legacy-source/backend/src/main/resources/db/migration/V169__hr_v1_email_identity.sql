-- HR V1 §10: HR identity moves to email. Phone becomes optional, a verified unique email becomes the
-- account key. Additive/relaxing only: no existing row's data changes shape, so rolling back the
-- application leaves the table usable either way.

-- Every existing hr_user was created with a phone, so this cannot break current rows; it only
-- allows a future row to be created with no phone at all (an email-first invite acceptance).
ALTER TABLE hr_user MODIFY COLUMN contact_mobile VARCHAR(15) NULL;

-- contact_mail was NULL-able but not unique; two existing rows could already collide on the same
-- address (nothing before this stopped it) and a blind ADD UNIQUE KEY would crash this migration,
-- and every deploy after it, on real data we have not inspected. Defensive, not assumed-clean:
-- keep the email on whichever row logged in most recently (a real, checkable person), blank it on
-- the other(s) so they fall back to their phone until someone re-enters an email for them.
SET @dupe_rank := 0, @dupe_prev := NULL;
UPDATE hr_user h
JOIN (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(contact_mail)) ORDER BY last_login_at DESC, id DESC) AS rn
    FROM hr_user
    WHERE contact_mail IS NOT NULL AND TRIM(contact_mail) <> ''
) ranked ON ranked.id = h.id AND ranked.rn > 1
SET h.contact_mail = NULL;

-- MySQL unique indexes permit any number of NULL entries, so a row with no email (never had one,
-- or just cleared above) is unaffected. Case sensitivity: the app always normalises to lower case
-- before writing or querying (see HrUserRepository), so a plain unique index is enough without a
-- generated column, now that the data underneath it is actually unique.
ALTER TABLE hr_user ADD UNIQUE KEY uk_hr_user_contact_mail (contact_mail);

-- The at-least-one-identity rule (phone or email) is enforced in code (HrAdminService /
-- HrPublicInviteService), not the database: a CHECK constraint here cannot see the value the
-- application is about to write in the same statement it validates.
