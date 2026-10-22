# Legacy job_preferences → vNext ownership and crosswalk

Source: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:10-45`.

There is **one** legacy `job_preferences` row per legacy learner (`learner_id` is non-null and unique). All legacy string fields are nullable; `jobNotificationsEnabled` defaults to true. Never create multiple vNext preference rows for a single learner membership and never turn null or an omitted PATCH into an opt-out.

| Legacy column | vNext destination | Rule |
|---|---|---|
| learner_id | college_memberships.id via an explicit legacy learner → user → membership crosswalk | Never treat an integer learner ID as a UUID. Verify matching college before writing. |
| role_preference | learner profile document `jobPreferences.rolePreference`; `rolePreferences` list | Preserve the singular original even if a multi-role UI is enabled. |
| specific_role_preference | `jobPreferences.specificRolePreference` | Nullable source → empty display field only at UI boundary. |
| work_shift_preference | `jobPreferences.workShiftPreference` | Normalize via `canonicalProfileWorkShift`; REMOTE remains distinct. |
| preferred_employment_city | `jobPreferences.preferredEmploymentCity` | Keep user's exact city text. |
| exam_slot_preference | `jobPreferences.examSlotPreference` | Retain Morning/Afternoon/Evening. |
| job_notifications_enabled | `jobPreferences.jobNotificationsEnabled`, and `placement_candidate_preferences.notifyMatchingJobs` | Preserve false explicitly, default true only when source absent. |
| pap_interest | `jobPreferences.papInterest` and `placement_candidate_preferences.papInterest` | Translate source labels to YES, NO, NEED_MORE_INFO for the placement table. |

Source of truth: `src/modules/people/profile-validation.ts` validates the learner-owned profile document. `src/modules/people/learner-profile-document-edit-service.ts` updates only supplied profile keys; `src/modules/placements/learner-placement-notification-service.ts` owns the independently saved placement notification toggles. `src/db/schema/placements.ts` declares `placementCandidatePreferences.membershipId` as a primary key, preserving one row per membership. Any import must use a transaction with an upsert on membership ID, never insert a second row or overwrite unrelated fields.

The owner has explicitly chosen **no production legacy data migration** for this fresh vNext installation. This is the field-level mapping contract for any later *explicitly approved* reviewed import; it is not a claim that historical rows have been migrated. Reject ambiguous legacy-to-membership mappings rather than guessing.
