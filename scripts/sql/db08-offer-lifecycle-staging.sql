-- DB-029 / DB08 offer lifecycle fidelity — STAGING ONLY, NOT A DRIZZLE MIGRATION.
-- Oracle: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
--   JobOffer.java + TpoOfferService.java + TpoOfferController.java.
--
-- Registration owner: Chat 1. This file MUST run after DB-021's
-- db08-outcome-fidelity-staging contract because it relies on released_at,
-- acceptance_channel and accepted_disputable_until being present.
--
-- Canonical status mapping:
--   legacy SELECTED  -> vNext SELECTED (new)
--   legacy RELEASED  -> vNext ISSUED (existing name, same observable meaning)
--   legacy ACCEPTED  -> vNext ACCEPTED
--   legacy DECLINED  -> vNext DECLINED
--   legacy EXPIRED   -> vNext EXPIRED (new)
--   legacy WITHDRAWN -> vNext WITHDRAWN
--
-- PENDING_VERIFICATION and REVOKED are declared by the legacy entity but were
-- not found as current TpoOfferService producer states in the pinned source.
-- Do not silently add them as active parity states without producer evidence.
--
-- Greenfield/no legacy data migration: these ALTERs are a proposal against the
-- current vNext table shape, not a historical data backfill.

-- Legacy records the actor type that created a selection and a separate verifier
-- when it is released. Existing issued_by_user_id remains the canonical user id
-- of the actor who created/issued the offer record; created_by_actor_type
-- snapshots whether that source was TPO or RECRUITER. Verification is separate.
ALTER TABLE placement_offers
  ADD COLUMN created_by_actor_type varchar(16),
  ADD COLUMN verified_by_user_id uuid,
  ADD COLUMN verified_at timestamp with time zone;

ALTER TABLE placement_offers
  ADD CONSTRAINT db29_offer_created_actor_type_ck CHECK (
    created_by_actor_type IS NULL
    OR created_by_actor_type IN ('TPO','RECRUITER')
  ),
  ADD CONSTRAINT db29_offer_verifier_pair_ck CHECK (
    (verified_by_user_id IS NULL) = (verified_at IS NULL)
  ),
  ADD CONSTRAINT db29_offer_verified_user_fk
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- The current partial unique index treats ISSUED/ACCEPTED as the only active
-- offer states. A pre-release SELECTED row is also active and must participate
-- in the same one-active-offer-per-application serialization.
DROP INDEX IF EXISTS placement_offers_active_application_uq;
CREATE UNIQUE INDEX placement_offers_active_application_uq
  ON placement_offers (application_id)
  WHERE status IN ('SELECTED','ISSUED','ACCEPTED');

-- Expand the persisted lifecycle only for source-active states.
ALTER TABLE placement_offers
  DROP CONSTRAINT IF EXISTS placement_offers_status_ck,
  DROP CONSTRAINT IF EXISTS placement_offers_lifecycle_ck;

ALTER TABLE placement_offers
  ADD CONSTRAINT placement_offers_status_ck CHECK (
    status IN ('SELECTED','ISSUED','ACCEPTED','DECLINED','EXPIRED','WITHDRAWN')
  ),
  ADD CONSTRAINT placement_offers_lifecycle_ck CHECK (
    (
      status = 'SELECTED'
      AND released_at IS NULL
      AND responded_by_user_id IS NULL
      AND responded_at IS NULL
      AND withdrawn_by_user_id IS NULL
      AND withdrawn_at IS NULL
    )
    OR (
      status = 'ISSUED'
      AND released_at IS NOT NULL
      AND responded_by_user_id IS NULL
      AND responded_at IS NULL
      AND withdrawn_by_user_id IS NULL
      AND withdrawn_at IS NULL
    )
    OR (
      status = 'ACCEPTED'
      AND responded_by_user_id IS NOT NULL
      AND responded_at IS NOT NULL
      AND withdrawn_by_user_id IS NULL
      AND withdrawn_at IS NULL
      AND (
        (acceptance_channel = 'IN_APP' AND released_at IS NOT NULL)
        OR acceptance_channel = 'EXTERNAL_IMPORT'
      )
    )
    OR (
      status = 'DECLINED'
      AND released_at IS NOT NULL
      AND responded_by_user_id IS NOT NULL
      AND responded_at IS NOT NULL
      AND withdrawn_by_user_id IS NULL
      AND withdrawn_at IS NULL
    )
    OR (
      status = 'EXPIRED'
      AND released_at IS NOT NULL
      AND expires_at IS NOT NULL
      AND responded_by_user_id IS NULL
      AND responded_at IS NULL
      AND withdrawn_by_user_id IS NULL
      AND withdrawn_at IS NULL
    )
    OR (
      status = 'WITHDRAWN'
      AND withdrawn_by_user_id IS NOT NULL
      AND withdrawn_at IS NOT NULL
    )
  ),
  ADD CONSTRAINT db29_offer_response_deadline_ck CHECK (
    expires_at IS NULL OR released_at IS NULL OR expires_at > released_at
  );

-- Current status history requires a user actor. Scheduled expiry is a real
-- source-active transition with no human actor, so a fake user id would corrupt
-- audit provenance. Add an explicit USER/SYSTEM actor kind.
ALTER TABLE placement_offer_status_history
  ALTER COLUMN actor_user_id DROP NOT NULL,
  ADD COLUMN actor_type varchar(16) NOT NULL DEFAULT 'USER';

ALTER TABLE placement_offer_status_history
  ADD CONSTRAINT db29_offer_history_actor_ck CHECK (
    (actor_type = 'USER' AND actor_user_id IS NOT NULL)
    OR (actor_type = 'SYSTEM' AND actor_user_id IS NULL)
  );

ALTER TABLE placement_offer_status_history
  DROP CONSTRAINT IF EXISTS placement_offer_status_history_status_ck,
  DROP CONSTRAINT IF EXISTS placement_offer_status_history_transition_ck;

ALTER TABLE placement_offer_status_history
  ADD CONSTRAINT placement_offer_status_history_status_ck CHECK (
    (
      from_status IS NULL
      OR from_status IN ('SELECTED','ISSUED','ACCEPTED','DECLINED','EXPIRED','WITHDRAWN')
    )
    AND to_status IN ('SELECTED','ISSUED','ACCEPTED','DECLINED','EXPIRED','WITHDRAWN')
  ),
  ADD CONSTRAINT placement_offer_status_history_transition_ck CHECK (
    (from_status IS NULL AND to_status IN ('SELECTED','ISSUED'))
    OR (from_status = 'SELECTED' AND to_status IN ('ISSUED','ACCEPTED','WITHDRAWN'))
    OR (from_status = 'ISSUED' AND to_status IN ('ACCEPTED','DECLINED','EXPIRED','WITHDRAWN'))
    OR (from_status = 'ACCEPTED' AND to_status IN ('ISSUED','WITHDRAWN'))
  ),
  ADD CONSTRAINT db29_offer_history_reversal_reason_ck CHECK (
    NOT (from_status = 'ACCEPTED' AND to_status = 'ISSUED')
    OR length(btrim(coalesce(reason, ''))) > 0
  ),
  ADD CONSTRAINT db29_offer_history_system_transition_ck CHECK (
    actor_type <> 'SYSTEM'
    OR (from_status = 'ISSUED' AND to_status = 'EXPIRED')
  );

-- Deliberate normalized mappings, not duplicate columns:
-- * legacy role_option_name -> placement_offers.role_title
-- * legacy ctc_lpa -> placement_offers.annual_ctc_inr after explicit unit policy
-- * legacy respond_by -> placement_offers.expires_at
-- * legacy joining_status -> placement_joining_outcomes.status/history
-- * legacy letter_url -> DB-016 private object receipt/reference, never public URL
-- * legacy responded_at / created_at / updated_at / version already have
--   canonical placement_offers fields.
--
-- NOT implemented by this staging DDL:
-- * service transition writers and application-status cascade;
-- * waitlist promotion;
-- * accepted-offer 48h reverse cascade;
-- * scheduler expiry producer;
-- * status-history event writer;
-- * private offer-letter object linkage;
-- * registered Drizzle schema/journal/snapshot.
