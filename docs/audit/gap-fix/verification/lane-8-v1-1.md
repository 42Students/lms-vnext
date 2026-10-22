# chat-8 — V1_lane8_1 static verification

Compared each listed file/service contract against the legacy behavior documented in the verification packet and the matching vNext implementation. **Source review only**: TypeScript, tests, DB/HTTP, browser and CI were not executed; dynamic runtime acceptance remains separate.

| Finding | Result | Evidence / resolution |
| --- | --- | --- |
| G2-11-031-023 | FIXED | Recruiter profile mobile errors bind to phone with legacy Check the mobile number copy |
| G2-1-035-063 | OK | First name required, focus on first invalid control, aria-invalid and field messages |
| G2-13-026-013 | OK | Status-only PATCH accepts statusType and optional programId; server hydrates CAS |
| G2-10-017-033 | OK | Extend deadline date-time picker validates future and suggests seven days, end-of-day IST |
| G2-11-002-063 | OK | Round editor permits own unused pending rounds only; readOnly prevents closed-drive writes |
| G2-12-007-043 | OK | Assignment drawer uses persisted submissionId to retrieve multi-asset history |
| G2-18-020-013 | OK | Active primary and group-backed elective sections are scoped; faculty delivery joins guard leakage |
| G2-18-020-033 | OK | Future elective learner overlaps enforce startsAt < other end and endsAt > other start |
| G2-13-001-023 | OK | Company report row click and separate keyboard drive-name links preserved |
| G2-17-002-033 | OK | Semester course mapping translates program_id/semester_id/course_ids and add-error banner |
| G2-19-005-003 | OK | Legacy calendar URL redirects to authenticated placement Schedule calendar, preserving filters |
| G2-2-023-003 | FIXED | Typed recycle-bin endpoint lists scoped archived entities including authored notifications |
| G2-20-006-023 | FIXED | Verified dgi.42lms.com host selects student/teacher switch; remount clears current and saved OTP attempts |
| G2-20-029-073 | OK | Programs are archived with FK history retained; active-only casefolded name/code uniqueness |
| G2-4-005-013 | OK | Faculty assignment status defaults to ALL including ended records |
| G2-4-024-013 | FIXED | Offering editor now submits null for unlimited seats, no UI-only 100000-seat ceiling |
| G2-4-024-043 | OK | Offering transaction provisions college elective group and group-backed class with valid delivery |
| G2-4-024-053 | OK | Identity-lock check consults current members and immutable group-member events |
| G2-5-003-033 | OK | Options failure is isolated, refresh retains old rows and row mutations retain retryable feedback |
| G2-5-008-033 | OK | Class maximum 1–200 and max>=min cross-field copy on create/edit |
| G2-5-010-053 | OK | Empty weekday selection expands all dates in the chosen IST range |
| G2-5-025-043 | OK | Credits 0–30; term course order 1-indexed |
| G2-5-030-013 | OK | Sign-in methods editor versioned persistence, dirty/busy, cross-tab storage change warning |
| G2-15-025-053 | OK | Recruiter requests typed statuses and college-scoped sourceJobId bridge to legacy Job IDs |
| G2-7-015-083 | OK | Legacy READY/BLOCKED/IN_PROGRESS mapped to readiness/phase while persisted lifecycle stays canonical per OD-25 |

Notes: Legacy deleted/archived differences follow the signed platform-retention decisions; no hard deletes are introduced. The DGIPUC switch changes UI entry preference only, never grants role permissions. Any stale role/tenant is rejected by the existing authenticated membership selection. The notification schema's private source records remain bounded to the selected college.
