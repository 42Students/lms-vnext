# Legacy person identity and lifecycle crosswalk (chat-14)

These are import and service contracts, NOT a completed import. No rows are migrated and no runtime permission or API behavior is implied by these schema additions. The canonical model remains one global users identity, separate college_memberships and membership_roles per college, role-specific profiles, enrollment/section records and recruiter company grants. The UI must choose a college x role workspace after authentication.

## Identity, status and source-key rules

| Legacy source | Destination / disposition | Required validation |
| --- | --- | --- |
| Learner.id, Faculty.id, Recruiter.id (numeric) | Separate `legacy_id_map` entries for source entity -> users.id, college_memberships.id and appropriate profile ID | Include source system and source college/batch; never cast numeric IDs to UUID; different source entity types may reuse integers |
| firstName + lastName | users.displayName, with original parts in the scoped profile import document only when approved | Preserve order; do not silently merge collisions or lose legal-name data |
| contactMobile / contactMail | users.phoneE164 / email only after ownership verification | Strip formatting carefully; a valid India 10-digit mobile can become +91 E.164; quarantine ambiguous country codes; email lowercase uniqueness requires case-insensitive collision review |
| contactPhone and secondary contact | role-specific profileDocument alternate contact with consent/access controls | Do not expose unverified contact details or conflate alternate with login credential |
| legacy userType, facultyType ordinal | membership_roles, system_roles and faculty employment/category mapping, after explicit enum crosswalk | Never promote a string, ordinal, or client-supplied label directly into an authorization role |
| suspendedAt / suspensionReason | college_memberships.status + suspendedAt + suspensionReason for source campus | A single college suspension must NOT disable access to another college; global users.platformStatus DISABLED only for audited global action |
| legacy isDeleted (BaseModel) | Tenant-scoped termination/archive and import provenance, not a global user deletion | Preserve history/audit references, check other college memberships before disabling canonical user; no silent hard-delete |
| legacy tokenVersion / JPA version | Token invalidation: revoke active identity_device_sessions on approved credential/security change; write CAS: users.version, college_memberships.version and profileDocumentVersion | Stored integers are not portable auth grants; users.version alone does NOT revoke sessions or increment itself; runtime CAS and revocation paths require verification |
| createdAt / updatedAt LocalDateTime | UTC-aware timestamptz destinations, keeping source timestamp metadata if ambiguity exists | Interpret old wall-clock as Asia/Kolkata only after verifying source timezone, never as UTC without evidence |
| recruiter lastLoginAt | nullable users.lastLoginAt | Preserve source timestamp with timezone review; fresh logins require a separate writer |
| recruiter tokenVersion | revoke user-scoped sessions, not an obsolete recruiter-only JWT | Validate global disable and scoped-company suspension separately |
| old unique username / uniqueId | learnerProfiles.legacyUniqueId or facultyProfiles.legacyFacultyCode and legacy_id_map | Never force nullable or colliding codes into unique users.identityUid; username-collision UX requires provisioner mapping |

## Learner source field map

- Source learner id, collegeId, organizationId, classId, programId, department, rollNumber and uniqueId map to a scoped legacy_id_map, college_memberships, academic enrollment/section/program/department joins, learnerProfiles.rollNumber and learnerProfiles.legacyUniqueId. A class transfer changes the enrollment projection, not global user identity.
- bulkImportBatchId maps to data_import_batches or scoped legacy_id_map metadata; no attempt to repurpose it as UUID.
- description, dob, gender, bloodGroup, address/currentAddress/permanentAddress and locality/postal fields belong to a private learnerProfiles.profileDocument, subject to field validation and access checks; do not copy them into users.
- identity, qualifications, certifications, languages, skills, codingProfiles, achievements, experiences, projects, extracurricular, hobbies, organizations and social URLs map to typed, reviewed profile-document sections. Importer must retain list ordering and source identities or quarantine unsupported shapes.
- website/profile image, resumeUrl, videoIntroUrl and videoIntroUploadedAt are historical pointers only: public URLs must never become authorized file access; migrate into private storage with signed reads only after MIME/size/tenant and consent review.

## Faculty source field map

- Source faculty id and uniqueId map to college-scoped legacy_id_map and facultyProfiles.legacyFacultyCode; nullable/duplicate codes must survive quarantine rather than being silently made into identityUid.
- deptId and collegeId map to verified department and membership; organizationId to tenant scope; facultyType ordinal and userType require explicit protected-role translation rather than direct enum casting.
- designation/department/description, dob/gender/bloodGroup, contact fields, all address variants, website, linkedin, googleScholar, researchGate and identity, languages, skills, qualifications, certifications, experiences, publications, awards, organizations, metadata map to facultyProfiles.profileDocument or role-specific attributes under access policy.
- Faculty tokenVersion/version and suspendedAt are handled through user-session revocation, per-college membership lifecycle, and independent profile revisions; proving password-change revoke-all remains an auth service obligation.

## Recruiter source field map

- Source recruiter ID maps separately to users UUID and company-scoped recruiter profile/grant; resolve companyId and industryCompanyId via source-scoped company crosswalk, never trust raw numeric company IDs.
- firstName/lastName become display name, contactMail/contactMobile become verified canonical contacts, designation becomes recruiter profile title. Preserve source createdByUserId/type only as audited provenance, never as authorization.
- Recruiter suspension applies to the relevant company grant/membership; users.platformStatus is global and must not accidentally lock unrelated staff/learner roles. No duplicate users may be created from a verified shared identity.
- lastLoginAt is import-only unless authenticated login flow writes the new field. Recruiter provision requires at least one verified reachable contact before active grant; a DB-wide requirement on optional users contacts would break permitted other roles.

## Runtime and error-contract follow-ups

- Global users.platformStatus DISABLED is checked by resolveSession; identity_device_sessions revokedAt and expiresAt are checked on every session lookup. Per-college membership suspension still must be verified at the role-switch/request-permission boundary. `users.version` is only a CAS column until writers update it with `WHERE version = expected`.
- Password/credential reset must atomically revoke ALL user sessions or an equivalent mechanism; do not claim parity solely because tokenVersion was renamed. The old one-college token invalidation cannot directly encode multi-college role grants.
- Onboarding should translate unique email, phone, or scoped staff-code conflicts to their field-specific messages, without fabricating a global username column. Collisions need preflight and quarantine.
- No code/test/CI executed; migrations 0216–0217 are unregistered until lane 15 review and coordinated service/tenant integration.
