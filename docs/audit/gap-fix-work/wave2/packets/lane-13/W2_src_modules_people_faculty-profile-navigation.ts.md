# Work packet (wave 2): edit src/modules/people/faculty-profile-navigation.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md

## G2-1-003-003  [P2] GAP  facet F01  effort M
- Legacy: `FacultyProfileController.java:191-215` header endpoint can be used directly as first section.
- vNext now: `teacher/profile/page.tsx:11-17` title/employment fields in header-like overview, editor `faculty-profile-navigation.ts:3-16` has no 'Header'.
- Fix: Restore header section navigation or map identity/profile image to managed faculty detail with explicit link.

## G2-1-003-004  [P2] GAP  facet F02  effort M
- Legacy: `ProfileSectionsPanel.js:54-69` 15 sections in order Header, About, Personal Details, Identity Documents, Languages, Contact, Address, Social Profiles, Education, Certifications, Work Experience, Skills, Publications & Research, Awards & Recognitions, Metadata.
- vNext now: `faculty-profile-navigation.ts:3-16` lists 12 About, Personal details, Address, Social profiles, Skills, Metadata, Awards, Publications, Experience, Certifications, Education, Languages.
- Fix: Restore original section order to match legacy, separate read-only Header/Identity/Contact if edit disallowed.
