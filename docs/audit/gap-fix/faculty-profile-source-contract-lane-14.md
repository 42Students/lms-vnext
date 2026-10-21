# Faculty profile migration contract (lane 14)

Current owner decision for lms-vnext: no legacy data migration is required while the legacy LMS has no active customers. This document preserves the source contract only; it does not run migration or alter the already-applied 0067 migration. The vNext faculty_profiles row is scoped by college_memberships.id, with independent profileDocument/profileDocumentVersion and private storage pointers.

| Legacy Faculty source | New scoped projection |
| --- | --- |
| id / uniqueId / deptId / collegeId / organizationId | source-key crosswalk -> users + college_memberships + departments, legacyFacultyCode, not global username |
| facultyType / userType / suspendedAt / tokenVersion / JPA version | verified membership_roles, membership status and session revocation; never copy source enum/ordinal as an auth grant |
| firstName / lastName / description / department | verified user displayName plus faculty basic/about profileDocument fields |
| gender / dob / bloodGroup | private personal section, validate source formats |
| contactPhone / contactMobile / contactMail | verified contact plus private alternates, masked to need-to-know |
| address / currentAddress / permanentAddress, city/state/pincode variants | separate historical and current/permanent address sections, preserve blanks and source order |
| website / linkedin / googleScholar / researchGate | social profile section; do not treat website as a trusted public image URL |
| identity | private identity section, do not expose source documents without reviewed consent |
| languages / skills | typed ordered arrays retaining levels and source IDs after validation |
| qualifications / certifications | typed ordered arrays with original grade/issue-date and private receipt mapping |
| experiences / publications | typed ordered arrays with optional historic fields retained |
| awards / organizations / metadata | typed source-aware profile sections; quarantine unsupported shapes rather than dropping silently |

When migration is ever approved, import only after confirming tenant UUID crosswalk, archived-orphan reconciliation, 15-section profile shape, safe file keys and original timezone. Round-trip source JSON and CAS validation must be verified before enabling imported edits. No legacy rows are moved in this change.
