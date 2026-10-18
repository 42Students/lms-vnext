# Chat-12 TPO source parity exceptions — 2026-10-18

**Sources:** `docs/audit/legacy-inventory-B.md` (lms-dev-2026 + true origin/prod-2026), `docs/audit/legacy-copy-B.md` (exact wording), and vNext source on `main`. Static comparison only. The legacy deployment has **not** been exercised with an owner-authenticated account; frontend source alone cannot certify side effects, modal interactions, emailed links, notifications or tenant isolation.

The inventory B TPO section contains **66 route/sub-view rows**: 57 marked MAPPED and **9 marked UNKNOWN**. `MAPPED` means a corresponding page/alias was found, *not* feature completeness. The nine unknowns are triaged below; the stale local-only `/tpo/leads` alias is **not** an origin/prod parity requirement.

| ID | Legacy route/view | Source-level vNext candidate | Finding, severity, verification needed |
|---|---|---|---|
| TPO-PARITY-12-01 | `/tpo/drives?tab=requests` | `/tpo/placements/lifecycle?view=REQUESTS` | **MAPPED in source, S2 acceptance:** lifecycle service branches on `selectedView==="REQUESTS"` using persisted `placementRecruiterDriveRequests` instead of fabricating requests from job statuses. Verify request triage, badges and side effects in browser. |
| TPO-PARITY-12-02 | `/tpo/drives?tab=drafts` | `/tpo/placements/lifecycle?view=DRAFTS` | **MAPPED in source, S3 acceptance:** request uses distinct DRAFT job state; confirm count, working filters, phone tab and empty states. |
| TPO-PARITY-12-03 | `/tpo/drives?tab=live` | `/tpo/placements/lifecycle?view=LIVE` | **MAPPED in source, S3 acceptance:** job PUBLISHED drive subset. Verify visibility cutoffs, mutation options and live badges. |
| TPO-PARITY-12-04 | `/tpo/drives?tab=closed` | `/tpo/placements/lifecycle?view=CLOSED` | **MAPPED in source, S3 acceptance:** status group from `TPO_CLOSED_JOB_STATUSES`, not unreviewed date guesses; verify cancelled/archived semantics. |
| TPO-PARITY-12-05 | `/tpo/drives/[jobId]?tab=discussion` | `/tpo/team`, `/tpo/messages`, dedicated drive discussion tabs | **UNKNOWN, S2:** legacy `DiscussionTab.jsx` is team-only internal notes, not necessarily applicant/recruiter messaging. Prove drive-specific conversation + colleague access parity independently. |
| TPO-PARITY-12-06 | `/tpo/team?tab=people` | `/tpo/team?tab=people` + `/tpo/settings/team` | **MAPPED in source, S2 acceptance:** `tpo-team/page.tsx` parses `tab` and renders people; verify legacy add/remove permission, removal-impact preview and pending work reassignment. |
| TPO-PARITY-12-07 | `/tpo/reports/outcomes` (After college) | `/tpo/reports/accreditation`, `/tpo/settings/after-college` | **UNKNOWN, S1:** no exact vNext `/tpo/reports/outcomes` page found. Accreditation export and after-college settings are not proof of learner outcomes cohort report parity. Require field/CSV/year denominator comparison. |
| TPO-PARITY-12-08 | `/tpo/settings?tab=webpage` (Placements page) | `/tpo/settings` + public `/placements` | **UNKNOWN, S2:** no `/tpo/settings/webpage` or `/tpo/settings/placement-page` route. Need actual CMS/editor toggle parity evidence; the existence of a public page does not establish placement-cell editing capability. |
| TPO-PARITY-12-09 | `/tpo/leads` (stale local-only prod ref) | `/tpo/recruiters` | **NOT AN OPEN PARITY DEFECT:** this alias existed only on stale *local* `prod-2026` (not `origin/prod-2026` or dev), per inventory B. Optional backward-compatible redirects are a separate product decision. |

## Exact copy and release checklist

The legacy sidebar labels are **Home**, **Placement eligibility**, **Engage**, **Drives**, **Team**, etc. Preserve their existing wording and use the vNext owner copy model instead of renaming controls during security hardening. In particular, the TPO Students `Projects` facet remains the legacy heading with an explicit tooltip explaining it counts self-reported entries, **not** released Projects assessment outcomes.

**Cannot mark parity complete from static source:** sign into the old LMS dev as a real TPO and record modal flows, notifications, CSVs, permission roles, real population and browser paths for the two UNKNOWN substantive items (outcomes report and webpage settings), plus full drive Discussion equivalence. These are external acceptance tasks, not a reason to skip other queue work.

See also `docs/audit/coverage/tpo-students-companies-chat12-ledger.md` for service-by-service behavioural and PostgreSQL gaps. Do not confuse route existence with a passed behavioural test.
