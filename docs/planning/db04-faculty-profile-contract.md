# DB04 Faculty self-profile contract

**Owner:** W01 / issue #21  
**Consumer:** W02 / issue #22  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**State:** SOURCE CONTRACT + STAGED PERSISTENCE; NOT ACTIVE / NOT DATABASE-VERIFIED

## Legacy user job

`/teacher/profile` is a real editable Faculty-only profile. Normal Faculty can edit their own profile. Learner, Faculty Admin and Mentor are redirected away from that route by the legacy page.

The shared legacy profile component gives Faculty these editable sections:

- Profile header / profile image
- About
- Personal Details
- Contacts
- Address
- Social Profiles
- Identity Documents
- Languages
- Education
- Certifications
- Work Experience
- Skills
- **Publications & Research** — Faculty only
- **Awards & Recognitions** — Faculty only
- Metadata/custom profile data consumed by the profile service

**Resume is NOT a Faculty surface.** The legacy Faculty Playwright suite explicitly documents Resume as learner-only and the shared profile component renders the Resume card only when `!isFacultyProfileSchema`. Do not add a Faculty Resume card merely because Learner has one.

## vNext source contract

`src/modules/people/faculty-profile-document.ts` is the canonical structured document for the editable non-relational Faculty sections.

Canonical normalized fields remain outside the JSON document:

- platform user identity/display name
- college membership and role
- department
- employment type
- academic title

The document contains the legacy Faculty-specific details and replaces uploaded public URLs with private receipt IDs.

### Deliberate privacy corrections

The legacy model persisted raw Aadhaar/PAN values in Faculty JSON and R2 references/URLs for uploaded documents. vNext does **not** copy those unsafe storage semantics.

- raw Aadhaar/PAN values are forbidden in `facultyProfileDocumentSchema`;
- only a masked identity summary and private document receipt IDs may appear in the profile JSON;
- private upload objects remain in tenant/member-scoped GCS keys;
- a receipt must be exact-owner, exact-purpose, malware-clean, non-revoked and generation/checksum-attested before use;
- signed reads are short-lived and generation-bound through `createPrivateReadGrant`;
- raw identity-secret handling remains a separate KMS/private-vault blocker and must not be recreated inside general profile JSON.

Security/privacy deviations are allowed by `AGENTS.md` when explicitly documented. The user-visible profile job must still be preserved.

## Authorization

W01 added `profile.self.manage` to the central permission policy.

It is intentionally allowed only when:

1. the platform user is ACTIVE;
2. the membership is ACTIVE;
3. the same membership has LEARNER or FACULTY role;
4. the resource college matches the membership college.

It does **not** inherit the normal global SUPER_ADMIN bypass.

`src/modules/people/faculty-profile-self.staged.ts` then narrows the persisted context to an actual FACULTY role and rechecks user/membership/role rows **inside the same PostgreSQL transaction as the mutation**. Stale sessions after suspension, disable or FACULTY-role removal cannot save.

## Persistence candidate

The active `faculty_profiles` table currently contains only normalized employment fields. W01 has staged:

`docs/planning/sql/db04-faculty-profile-document-staging.sql`

Candidate additions:

- `faculty_profiles.profile_document jsonb NOT NULL DEFAULT '{}'`
- `faculty_profiles.profile_document_version integer NOT NULL DEFAULT 1`
- JSON object check
- version >= 1 check
- optimistic-write version behavior

The staged adapter uses version 0 only to mean “no faculty_profiles row exists yet”; first insert becomes version 1. Existing rows receive version 1 when the migration is promoted.

## Private receipt generalization

The still-unregistered DB04 receipt table has been generalized from learner-only naming to:

`profile_private_document_receipts`

It remains membership-owned and supports:

- AADHAAR
- PAN
- MARKSHEET
- RESUME (Learner)
- PROFILE_IMAGE
- EDUCATION_CERTIFICATE
- CERTIFICATION
- EXPERIENCE_CERTIFICATE
- OFFER_LETTER

`related_entry_id` replaces the learner-specific `education_entry_id`, allowing exact linkage to an education/certification/experience item without introducing a second upload system.

## Planned W02 API contract after W01 activation

W01 will expose the self-service route only after migration promotion/replay:

### GET `/api/profile/faculty/me`

Returns:

```json
{
  "document": {},
  "version": 1
}
```

### PUT `/api/profile/faculty/me`

Same-origin request.

```json
{
  "document": {},
  "expectedVersion": 1
}
```

Returns the saved document and incremented version. A stale `expectedVersion` returns conflict. Wrong role, suspended membership, disabled user or cross-tenant context is forbidden.

W02 may build the Faculty UI against this contract, but must not introduce a separate Faculty persistence model or make the staged adapter/runtime route active itself.

## Promotion blockers

Do not call this active until all are true:

- canonical `src/db/schema/profiles.ts` contains the two Faculty profile columns;
- generalized DB04 receipt schema is exported from `src/db/schema/index.ts`;
- a **generated** Drizzle migration + snapshot is registered without journal collision;
- `npm run db:journal:verify` and `npm run db04:promotion:verify` pass;
- empty and latest disposable PostgreSQL replay passes;
- optimistic-write, disable/suspension/role-revoke, tenant-negative and private-receipt tests pass;
- private GCS bucket and scanner are actually configured;
- raw identity-secret handling is either KMS-backed or kept unavailable.

Current GitHub Actions runner allocation is still blocked before job steps, so none of those runtime gates is being falsely marked green.
