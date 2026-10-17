# TPO Recruiters – chat-2 round 6

| Gap | Status | Evidence |
| --- | --- | --- |
| TPO-recruiters-38 | DONE (source, tests not run) | `src/modules/placements/tpo-recruiter-lead-policy.ts` excludes common private-email providers including icloud/protonmail and capitalizes inferred employer first label, named test in `tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts`. |

| TPO-recruiters-39 | PARTIAL — OPEN | `src/components/tpo/recruiter-leads-workspace.tsx` restores concise view count and retained Add recruiter lead action; named test `tests/unit/chat2-tpo-recruiter-leads-copy.test.ts`. Other landing page sections remain. |
| TPO-recruiters-40 | PARTIAL — OPEN | `src/components/tpo/recruiter-lead-detail-workspace.tsx` now uses "Edit contact details" and "Save" with existing recruiter leads back link; named test in same file. |
| TPO-recruiters-43 | DONE (source, tests not run) | Table and board show designation and "Unnamed contact" fallback without hiding recruiter actions; named test in same file. |

| TPO-recruiters-07 | PARTIAL — OPEN | Engage Needs doing now uses persisted Follow-ups due, No next step, Gone quiet and Unassigned counts, hides zero chips, shows Nothing right now, and links to active recruiter access; named `tests/unit/chat2-tpo-recruiter-needs.test.ts`. Toggle persistence and other legacy counts remain. |
| TPO-recruiters-39 | DONE (source) | Legacy first-run empty message and count/add action; named `tests/unit/chat2-tpo-recruiter-needs.test.ts`. |
