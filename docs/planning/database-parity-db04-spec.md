# DB04 — Profile verification and academic marks schema contract

**Status:** SOURCE-LEVEL GAP CONFIRMED; code and storage not verified.
**Legacy:** `V187__profile_verification.sql`, `V192__academic_marks_as_earned.sql`. Do not confuse `profile_verification` with OTP/account `LearnerVerification`.

## Separate data concepts

1. Editable learner profile (and private document object metadata), owned by learner membership.
2. Submitted Education/Identity snapshot, submission time and verification-review status.
3. Previously verified snapshot and reviewer/time that remain effective while a pending update exists.
4. Immutable event history for SUBMITTED, UPDATE_SUBMITTED, VERIFIED and SENT_BACK actions.
5. Raw academic marks as earned: grade/scale/max for each education level; separately normalized comparable percentages and applied college-specific CGPA conversion policy/version.

## Target invariants

- One current verification row per (learner membership, section); section EDUCATION or IDENTITY; status SUBMITTED, SENT_BACK, VERIFIED or UPDATE_PENDING.
- Sent-back requires reason; reviewers must be authorized in the **same college**; TPO verifier rights depend on current college settings and never implicitly extend to coordinators.
- `verified_snapshot` cannot be overwritten by unreviewed changes; `submitted_snapshot` and events retain their own timestamp/actor attribution.
- Sensitive identity numbers must be masked in snapshots. Private object metadata stores GCS path, digest, MIME, version, owner/scope, purpose and deletion/retention information — never long-lived public URLs or binary document data.
- Changes are transactional, version-checked and have an append-only event. A replayed stale reviewer action fails.
- Legacy `marks_json` cannot be replaced solely with normalized basis points without preserving original scale and the college's conversion formula.

## Required negative tests

- [ ] learner cannot verify self, inactive reviewer cannot decide, unrelated college cannot read/write;
- [ ] SUBMITTED -> SENT_BACK -> resubmit -> VERIFIED -> UPDATE_PENDING retains immutable history and old verified state;
- [ ] two concurrent reviewer actions result in exactly one valid state transition;
- [ ] private documents inaccessible to unrelated learners/HR;
- [ ] original 9.2/10 CGPA and converted percentage both round trip correctly under differing college conversion policies;
- [ ] generated migrations replay against disposable PostgreSQL; FK, uniqueness, provenance and storage lifecycle tested.

Schema work may proceed while real Cloud Storage is unconfigured, but storage-backed workflows remain BLOCKED until actual GCP configuration and tests.
