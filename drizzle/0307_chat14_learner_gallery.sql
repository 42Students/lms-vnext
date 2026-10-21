-- [chat-14] DB04 learner image gallery: candidate for lane-15 journal registration.
-- DO NOT ENABLE DB04_PROFILE_GALLERY_READY until replay, constraints, scanner
-- attestation, ownership negatives and API/UI tests have been verified.
-- The legacy JSON image list is imported ONLY via college/member crosswalk,
-- never as public URLs or bearer identities.
CREATE TABLE learner_profile_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  receipt_id uuid NOT NULL,
  receipt_purpose varchar(32) NOT NULL DEFAULT 'PROFILE_IMAGE'
    CHECK (receipt_purpose = 'PROFILE_IMAGE'),
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  legacy_image_id integer,
  legacy_image_public_key varchar(32),
  legacy_index integer,
  legacy_folder_name varchar(120),
  legacy_active_int integer,
  legacy_image_url text,
  legacy_was_deleted boolean,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz,
  CONSTRAINT learner_profile_images_receipt_fk
    FOREIGN KEY (receipt_id, learner_membership_id, receipt_purpose)
    REFERENCES profile_private_document_receipts(id, owning_membership_id, purpose)
    ON DELETE RESTRICT,
  CONSTRAINT learner_profile_images_active_ck
    CHECK ((is_active AND deactivated_at IS NULL) OR
           (NOT is_active AND deactivated_at IS NOT NULL)),
  CONSTRAINT learner_profile_images_owner_receipt_uq
    UNIQUE (learner_membership_id, receipt_id)
);
--> statement-breakpoint
CREATE INDEX learner_profile_images_active_order_idx
  ON learner_profile_images(learner_membership_id,display_order)
  WHERE is_active = true;
--> statement-breakpoint
CREATE INDEX learner_profile_images_stable_order_idx
  ON learner_profile_images(learner_membership_id,display_order,id)
  WHERE is_active = true;
--> statement-breakpoint
CREATE INDEX learner_profile_images_legacy_source_idx
  ON learner_profile_images(learner_membership_id,legacy_image_id)
  WHERE legacy_image_id IS NOT NULL;
