# Learner qualification compatibility and certificate safety (lane 16)

Source: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:18-83`; old DTO mapping: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:89-149`.

No legacy learner data migration is approved for LMS vNext. Never treat a historic numeric qualification ID, `certificateUpload` URL, or `private-doc:` key as a vNext UUID or authenticated signed grant.

## Approved field-level mapping

- Source `educationType`, `program`, `specialization`, `institutionName`, `startYear`, `endYear`, `isCurrentlyPursuing`, `gradingType`, `grade`, `maxGrade`, `isRecentEducation`, `qualifyingExam`, `examRank`, and `examDetails` map to the existing profile education JSON equivalents, with the legacy score represented as `gradeObtained`.
- The legacy compatibility properties `degree`, `field`, `score`, and `description` remain separate optional profile JSON fields and must survive any edit without synthesizing unverified score values.
- Source `certificateUpload` must **not** be saved as an operational URL in vNext profile JSON. For an approved import, retrieve the bytes from an authorized source, rehost into owner-scoped private storage, complete malware scanning, create a `profile_private_document_receipts` record with purpose `EDUCATION_CERTIFICATE` or `MARKSHEET`, owner membership and associated education entry ID, then set `certificateReceiptId`. An original source URL may exist only in privileged import audit, never a learner-visible link or API grant.
- The profile edit service verifies every supplied receipt ID belongs to the authenticated membership, is CLEAN and unrevoked, is within retention, and (when relatedEntryId is set) matches that education entry before accepting the document.
- Nonempty *application* qualification sets require exactly one `isRecentEducation=true`. Optional learner profile education may be empty or have no primary; more than one primary is always invalid.

Activation of DB04 normalized education remains separate and requires reviewed staged parent/FK migrations, tenant-scoped legacy identity maps, generation checks, no dangling imported references, and rollback planning. This document does not claim any historical import or scanner deployment was executed.
