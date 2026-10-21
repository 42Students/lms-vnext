# Placement drive change request source crosswalk — lane 14

Legacy drive_change_request stores bigint ID, numeric college/job IDs, direction TO_COMPANY/TO_COLLEGE, detailed field codes CTC_LPA/STIPEND/etc, kind PROPOSE/ASK, currentValue, proposedValue, note, answerValue, replyText, creator type/name and resolvedAt. Native vNext uses UUID job/creator, proposerParty/targetParty, mode SUGGEST/ASK, coarser PAY/ELIGIBILITY/etc field and status/decidedAt. New provenance fields preserve source distinctions without changing native authorization.

Each source ID must resolve via scoped legacy_id_map; do not assume legacy fields CTC_LPA/STIPEND can safely collapse into one PAY row without collision review. Former actor type/name snapshots are display/audit only, and not permission grants. Source resolution time is separate from original decision timestamp and requires confirmed timezone conversion.

OPEN uniqueness now covers (job, field, proposerParty, targetParty) except OTHER, which is allowed to repeat. This protects concurrent creates after index registration, but existing duplicates and legacy fine-grained PAY fields must be preflighted. Same proposed/current semantic equality remains a service-side normalized compare under a job lock and cannot be enforced by this SQL index alone. Status transitions and response messaging remain service owned.

Migration 0230 is unregistered; no SQL or CI executed.