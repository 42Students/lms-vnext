# DB04 learner profile gap closure contract

**Task relationship:** peer-assist for original core DB-004 + blocked DB-007  
**Worker:** Chat 3  
**Date:** 2026-10-12  
**Status:** source/design/staging only — not exported, migrated or PostgreSQL verified.

The DB01 150-row cross-domain review queue routes 66 profile-owned fields to
DB04. Source review against frozen backend `21bad59d...` proves 11 active
learner concepts were not represented safely by the current learner typed
profile document.

## Active gaps closed at target-design level

The learner JSON document should add these typed fields during API/schema
cutover, without adding new SQL columns because `learner_profiles.profile_document`
already owns this safe non-relational profile content:

- `address.currentCity`
- `address.currentState`
- `address.currentPincode`
- `address.permanentCity`
- `address.permanentState`
- `address.permanentPincode`
- `socialProfiles.codingProfiles`

`codingProfiles` is a closed platform-key → normalized username map preserving
the current legacy vocabulary: LEETCODE, HACKERRANK, CODECHEF, CODEFORCES, GFG,
HACKEREARTH. Do not persist arbitrary profile URLs; the display URL is derived.

## Privacy-bearing fields

Raw identity secrets must not return to generic JSON.

- Aadhaar/PAN current document: `learner_profile_identity_summaries` stores
  last-4 only.
- Current private Aadhaar/PAN/Resume object: one same-owner,
  exact-purpose `learner_profile_private_document_bindings` row.
- Receipt write must be CLEAN, non-revoked and non-expired.
- Raw Aadhaar/PAN remains a private ingestion concern, not profile JSON.

## Video intro

Legacy learner profile exposes a one-time video intro and uses
`video_intro_uploaded_at` as the second-upload guard. Staged target is one
`learner_profile_video_intros` row per membership, backed by an exact-owner
`VIDEO_INTRO` private receipt. UPDATE/DELETE are rejected in the database
candidate so “one-time” cannot be bypassed by direct SQL.

## Legacy aliases

`faculty.address` and `learner.address` are explicitly marked
backward-compatibility fields in the frozen models and are not read/written by
the current AddressDTO profile services. They are retirement candidates, not
automatic retirements; DB19/product approval remains required.

## Authorization-bearing correction

`faculty.faculty_type` must **not** be mapped wholesale to
`faculty_profiles.employment_type`. The persisted ordinal feeds
`UserPrincipal.facultyType` and includes ADMIN, MENTOR and TPO along with
academic/employment labels. Greenfield vNext must split it deliberately across
canonical membership roles and profile employment/academic attributes.

## Promotion boundary

Canonical staging inputs in this peer pass:

- `src/db/schema/db04-learner-profile-extras.staged.ts`
- `docs/planning/sql/db04-learner-profile-extras-candidate.sql`
- `docs/planning/db01-chat03-db04-profile-peer-review.json`

Only Chat 1/W01 may register the migration or export staged schema. API phase
must update the typed learner document and producers. No field in this pass is
runtime/PostgreSQL verified.
