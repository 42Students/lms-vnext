# Work packet (wave 2): edit src/modules/people/faculty-profile-document.ts

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md, docs/audit/gap2/lane-4/faculty-model.md

## G2-1-003-011  [P2] GAP  facet F04  effort M
- Legacy: `ProfileHeaderDTO.java:10-19` exposes firstName, lastName, employee uniqueId, department/deptId, facultyType and profileImage.
- vNext now: `teacher/profile/page.tsx:11-17` shows displayName, email/mobile, academicTitle/employmentType; `faculty-profile-document.ts:302` has private image receipt.
- Fix: Map employee ID, dept and faculty type into displayed header and secure profile image preview.

## G2-1-003-012  [P2] GAP  facet F04  effort S
- Legacy: `PersonalDetailsDTO.java:10-12` wire `gender`, `dob`, `bloodGroup`.
- vNext now: `faculty-profile-document.ts:123-134` uses `gender`, `dateOfBirth`, `bloodGroup`, editor `faculty-profile-editor.tsx:25`.
- Fix: Map old dob to dateOfBirth and preserve imported values without silent loss.

## G2-1-003-014  [P2] GAP  facet F04  effort M
- Legacy: `ContactDTO.java:20-27` includes contactMobile, alternate contactPhone, contactMail.
- vNext now: `faculty-profile-document.ts:46-73` models identical three but editor does not expose; `teacher/profile/page.tsx:13-14` shows canonical email, phone.
- Fix: Expose appropriate contact data/self-edit pathway with identity protection and exact role distinctions.

## G2-1-003-015  [P2] GAP  facet F04  effort M
- Legacy: `SocialProfileDTO.java:14-45` declares six social profile fields plus codingProfiles map and codingProfileLinks array.
- vNext now: `faculty-profile-document.ts:104-121` supports six fixed links only; no codingProfiles/codingProfileLinks.
- Fix: Include flexible coding links or explicitly migrate data to approved URL model with no loss.

## G2-1-003-016  [P2] GAP  facet F04  effort S
- Legacy: `AddressDTO.java:10-20` has current/permanent addresses plus legacy city/state/pincode shared trio.
- vNext now: `faculty-profile-document.ts:75-102` retains all 11 keys; editor `faculty-profile-editor.tsx:26,99-102` only renders eight and not legacy trio.
- Fix: Show legacy city/state/pincode values when populated and provide managed migration.

## G2-1-003-017  [P2] GAP  facet F04  effort M
- Legacy: `EducationDTO.java:17-50` contains examDetails map and isRecentEducation, qualifyingExam/rank and certificateUpload.
- vNext now: `faculty-profile-document.ts:152-194` schema supports examDetails/isRecentEducation/qualifyingExam/rank and receipt ID; editor `faculty-profile-editor.tsx:29` omits examDetails form.
- Fix: Provide structured exam-details editing/viewing and receipt download; never store raw URL.

## G2-1-003-018  [P2] GAP  facet F04  effort L
- Legacy: `CertificationDTO.java:11-26`, `ExperienceDTO.java:12-31` carry certificateUpload, internshipCertificateUpload and offerLetterUpload strings.
- vNext now: `faculty-profile-document.ts:195-237` replaces with receipt UUIDs; `faculty-profile-editor.tsx:30-31` excludes managed document fields.
- Fix: Add secure read-only attachment indicators and authorized replacement/receipt workflow.

## G2-1-003-027  [P2] GAP  facet F06  effort M
- Legacy: `SkillDTO.java:10-11`, `LanguageDTO.java:10-11` have no declared required or length constraints.
- vNext now: `faculty-profile-document.ts:136-150` requires nonempty name, max 120 and proficiency <=64.
- Fix: Show validation and migration/cleanup rules for old blank or oversized rows.

## G2-1-003-028  [P2] GAP  facet F06  effort M
- Legacy: `PublicationDTO.java:10-16`, `AwardDTO.java:10-13` do not require titles in DTO.
- vNext now: `faculty-profile-document.ts:239-260` enforces required title <=300, four-digit year and description max.
- Fix: Allow correcting existing blank-title rows without blocking unrelated changes, or migrate before enablement.

## G2-1-003-051  [P2] GAP  facet F12  effort M
- Legacy: `FacultyProfileServiceImpl.java:207-241,362-396,407-435,445-475,480-514,518-552,558-592` repeatable lists have no defined max count.
- vNext now: `faculty-profile-document.ts:292-298` caps languages/education 30, certifications/experiences 50, skills/publications/awards 100.
- Fix: Record intentional record-count limits, create migration report for oversized histories, no silent truncation.

## G2-1-003-059  [P2] GAP  facet F14  effort L
- Legacy: `EducationDTO.java:50`, `CertificationDTO.java:25`, `ExperienceDTO.java:26-27` include document URLs for receipts.
- vNext now: `faculty-profile-document.ts:183,203,223-224` uses UUID attachments; self editing prohibits replacing receipts (`faculty-self-section-model.ts:72-80`).
- Fix: Provide read-only file affordances plus admin attachment lifecycle; do not expose raw bucket URLs.

## G2-1-003-079  [P2] GAP  facet F22  effort M
- Legacy: `ProfileSectionsPanel.js:353-408` section API uses array index and no stable row IDs.
- vNext now: `faculty-profile-document.ts:136-260,322-333` adds UUID ID per row and duplicate-ID guard.
- Fix: Generate stable IDs during migration preserving exact ordering and link receipts.

## G2-20-030-031  [P2] GAP  facet F05  effort M
- Legacy: Legacy faculty repeatable items are in endpoint-provided order; update/delete index-based (`docs/legacy-source/frontend/src/api/Services/ProfileService.js:267-305`, `docs/legacy-source/frontend/src/components/profile/about.js:295-347`)
- vNext now: New repeatables persist UUID receipts and document arrays (`src/components/people/faculty-profile-editor.tsx:109-134`, `src/modules/people/faculty-profile-document.ts:124-149`)
- Fix: Retain visible item sequence and correct per-row update/delete targeting

## G2-4-020-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy teacher profile may show website image and linkedIn/googleScholar/researchGate. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:137-148`)
- vNext now: New profileDocument has private profileImageDocumentId, social links for LinkedIn, Scholar and ResearchGate. (`src/modules/people/faculty-profile-document.ts:104-120`; `src/modules/people/faculty-profile-document.ts:299-303`)
- Fix: Map website image URL to controlled storage receipt, preserve social links.

## G2-4-020-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy description TEXT nullable. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:74-76`)
- vNext now: New about.description trimmed max5000 default blank. (`src/modules/people/faculty-profile-document.ts:282-287`)
- Fix: Preserve long and null legacy About text during migration.

## G2-4-020-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy gender,birth date string,bloodGroup separate columns. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:78-86`)
- vNext now: New personalDetails has gender/dateOfBirth YYYY-MM-DD validation/bloodGroup. (`src/modules/people/faculty-profile-document.ts:123-134`)
- Fix: Convert historical DOB formats and null safely, validate calendar.

## G2-4-020-019  [P2] GAP  facet F05  effort L
- Legacy: Legacy languages,skills,qualifications,certifications,experiences,publications,awards are JSON arrays. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:155-188`)
- vNext now: New Faculty profileDocument has corresponding typed arrays with capped entries. (`src/modules/people/faculty-profile-document.ts:288-298`)
- Fix: Map each legacy DTO item shape/order, preserve identities and optional values.

## G2-4-020-020  [P2] MISSING  facet F05  effort M
- Legacy: Legacy organizations JSON array and metadata map also on faculty entity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:190-198`)
- vNext now: New profile doc has metadata scalar record but no organizations collection. (`src/modules/people/faculty-profile-document.ts:299-302`)
- Fix: Add safe legacy organizations history if still used by faculty profile.

## G2-4-020-024  [P2] GAP  facet F06  effort M
- Legacy: Legacy contact, bio and repeated JSON updates may set nullable fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:74-198`)
- vNext now: New faculty profile document Zod defaults missing sections, strict validation and versioned write. (`src/modules/people/faculty-profile-document.ts:282-333`; `src/modules/people/faculty-profile-self.staged.ts:109-119`)
- Fix: Support partial field merge/cancel without erasing old unsupported fields.

## G2-4-020-047  [P2] GAP  facet F14  effort M
- Legacy: Legacy profile image in website field can refer external URL. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:137-140`)
- vNext now: New profileImageDocumentId UUID nullable, stored privately. (`src/modules/people/faculty-profile-document.ts:299-303`)
- Fix: Convert approved legacy image URLs to receipt references without hotlink leakage.

## G2-4-020-048  [P2] GAP  facet F14  effort L
- Legacy: Legacy identity JSON, certifications and experience docs can carry file metadata. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:150-178`)
- vNext now: New identity document receipt IDs and typed experienceCertificateDocumentId. (`src/modules/people/faculty-profile-document.ts:269-319`; `src/modules/people/faculty-profile-document.ts:213-223`)
- Fix: Preserve secure file references and signed access for legitimate docs.

## G2-4-020-052  [P2] GAP  facet F16  effort S
- Legacy: Legacy entity address has current/permanent and shared fallback for city/state. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:98-135`)
- vNext now: New address schema stores all same fields but input max restrictions. (`src/modules/people/faculty-profile-document.ts:75-102`)
- Fix: Verify old fallback order and overflow line wrapping.

## G2-4-020-058  [P2] GAP  facet F19  effort M
- Legacy: Legacy JSON repeatable lists not inherently paginated. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:155-193`)
- vNext now: New arrays have hard caps language30,education30,skills100,publication100. (`src/modules/people/faculty-profile-document.ts:292-298`)
- Fix: Plan data import and UI validation for legacy faculty above collection caps.

## G2-4-020-063  [P2] GAP  facet F21  effort M
- Legacy: Legacy profile social links and identity docs may point to external services. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:137-153`)
- vNext now: New validates http(s) social URLs and stores private file receipt IDs, no hotlink identity values. (`src/modules/people/faculty-profile-document.ts:9-21`; `src/modules/people/faculty-profile-document.ts:269-280`)
- Fix: Verify signed private document read and import of sanctioned sources.

## G2-4-020-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy JSON identity/languages/skills/qualifications/certifications/experiences/publications/awards/organizations/metadata. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:150-198`)
- vNext now: New profileDocument supports all except standalone organizations collection; identity masked. (`src/modules/people/faculty-profile-document.ts:282-319`)
- Fix: Record explicit dropped organizations and identity fields with retention policy.
