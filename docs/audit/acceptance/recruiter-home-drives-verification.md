# Recruiter Home Drives — chat-7 acceptance evidence

Source contracts for previously-fixed and reviewed UI flows. The orchestrator runs tests and approves runtime/database behavior; source-only evidence is not a runtime pass.

| ID | Status | Evidence (file + gap-named test) |
|---|---|---|
| REC-home-drives-02 | DONE | `src/modules/placements/hr-today-action-queue-model.ts`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-02 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-03 | DONE | `src/app/(authenticated)/hr/home/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-03 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-14 | DONE | `src/components/placements/recruiter-placement-portfolio.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-14 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-15 | DONE | `src/components/placements/recruiter-placement-portfolio.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-15 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-17 | DONE | `src/components/hr/hr-unsent-drive-alert.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-17 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-18 | DONE | `src/app/(authenticated)/hr/drives/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-18 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-20 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-20 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-24 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-24 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-25 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-25 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-26 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-26 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-28 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-28 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-29 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-29 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-35 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-35 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-36 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-36 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-39 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-39 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-40 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-40 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-42 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-42 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-48 | DONE | `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-48 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-49 | DONE | Accessible `ConfirmDialog` pre-send bulk summary (no native confirm), guarded retry retains failed candidates; `tests/unit/chat-7-graceful-actions.test.ts` — `GR-35 REC-home-drives-49 previews bulk results in a keyboard-reachable confirmation dialog`;  `src/components/placements/recruiter-result-controls.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-49 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-R01 | DONE | `src/modules/placements/hr-tpo-notification-service.ts`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-R01 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-R08 | DONE | `src/modules/placements/recruiter-drive-search-service.ts`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-R08 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-56 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-56 preserves the verified recruiter drive behavior`. Authored, not executed. |

Remaining gaps (including private applicant disclosure and ZIP export) require full behavior and permission verification. Uploaded resume ZIP and job-description files need private object storage/malware scanning, so those are BLOCKED pending infrastructure.

| REC-home-drives-23 | BLOCKED | Private, scanned PDF/Word job-description storage is not configured. \`tests/unit/chat-7-storage-blockers.test.ts\` — \`REC-home-drives-23 secure file provider pending\`. |
| REC-home-drives-43 | BLOCKED | Resume ZIP requires access to private scanner-attested source files. \`tests/unit/chat-7-storage-blockers.test.ts\` — \`REC-home-drives-43 secure file provider pending\`. |
| REC-home-drives-55 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-tab-legacy.test.ts` — `REC-home-drives-55 orders overview, applicant, round, offer, request and discussion tabs`. Counts from authorized job aggregates; tests authored, not run. |

## Round 5 — graceful recruiter requests and bulk results
`src/components/placements/recruiter-result-controls.tsx` now uses shared `apiFetch` for single and multi-candidate writes, preserving unsuccessful selections; `src/components/hr/hr-drive-draft-form.tsx` retains the draft on errors and never prints raw server codes; `src/components/hr/recruiter-request-cancel-button.tsx` uses a confirmation dialog and shared friendly errors. `tests/unit/recruiter-home-drives-chat7-round5-graceful.test.ts` includes `REC-home-drives-12/-22/-29/-49` and `GR-04/-35/-90`. Tests not run.

| REC-home-drives-11 | DONE | `src/app/(authenticated)/hr/home/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-11 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-31 | DONE | `src/modules/placements/hr-drive-round-presets.ts`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-31 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-34 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-34 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-50 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-50 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-54 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-54 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-55 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-55 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-R07 | NOT-A-GAP | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-R07 confirms the audited source behavior`. Owner decision requires IST everywhere, so differing traveler-local zone is intentional. |

| REC-home-drives-27 | DONE | `src/modules/placements/hr-drive-draft-model.ts`; `tests/unit/recruiter-home-drives-chat7-drafts-r7.test.ts` — `REC-home-drives-27 matches the reviewed contract`. Test authored, not executed. |

| REC-home-drives-30 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-drafts-r7.test.ts` — `REC-home-drives-30 matches the reviewed contract`. Test authored, not executed. |

| REC-home-drives-32 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-drafts-r7.test.ts` — `REC-home-drives-32 matches the reviewed contract`. Test authored, not executed. |

## Chat-14 reassignment — batch 1 (authored; tests not executed)

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-11 | DONE | `src/app/(authenticated)/hr/home/error.tsx` now shows legacy account recovery with Retry; existing no-college screen remains scoped; named test |
| REC-home-drives-31 | PARTIAL — OPEN | `HR_DRIVE_ROUND_PRESETS` legacy labels verified; Hire again heading/copy still under review; named test |
| REC-home-drives-54 | DONE | Existing role-scoped `not-found.tsx` shows exact legacy missing-drive copy; named test |
| REC-home-drives-R07 | NOT-A-GAP | Owner decision IST everywhere takes precedence over viewer-local legacy formatting; `hr/home/page.tsx` and portfolio format IST; named test |

## Chat-14 reassignment — batch 2 (tests authored, not run)

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-16 | DONE | `src/components/placements/recruiter-placement-portfolio.tsx` stable-sorts unanswered requests first and highlights those cards; named test in `tests/unit/recruiter-chat14-round2.test.ts` |
| REC-home-drives-27 | DONE | `hrDriveDraftSchema` enforces role title with `Enter a role title`; description and location optional; named unit schema test |
| REC-home-drives-30 | DONE | `src/components/hr/hr-drive-draft-form.tsx` post-confirmation feedback says `Sent to the placement cell for review`; preserves failed request drafts; named test |
| REC-home-drives-31 | DONE | `hr-drive-draft-form.tsx` now uses `Hire again` lowercase title, and existing three legacy round presets verified; named tests |
| REC-home-drives-32 | DONE | `hr-drive-draft-form.tsx` browser beforeunload and accessible `Discard this drive draft?` in-app confirmation, including brand-new drafts; named test |
| REC-home-drives-52 | PARTIAL — OPEN | Offers now 15/page and `EXPIRED` filter, with persisted scoped count in `hr-job-read-service.ts`. Selection/PENDING/REVOKED are not `placement_offers` statuses, so require separate source; named unit test |
