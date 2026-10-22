-- [chat-14] P0 company drive suggestion acceptance must not be
-- represented as ACCEPTED without an atomic job mutation receipt.
-- NOT VALID tolerates historical decisions while preventing new incorrect
-- accepted writes after the TPO mutation service is deployed.
-- Lane 15: coordinate replay with service owner; applying before service
-- rollout deliberately blocks the legacy status-only ACCEPT endpoint.
ALTER TABLE placement_drive_change_requests
 ADD CONSTRAINT placement_drive_changes_accepted_receipt_ck
 CHECK (status <> 'ACCEPTED' OR
        (applied_at IS NOT NULL AND applied_by_user_id IS NOT NULL
         AND applied_job_version IS NOT NULL)) NOT VALID;
