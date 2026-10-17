# TPO Recruiters – chat-2 round 6

| Gap | Status | Evidence |
| --- | --- | --- |
| TPO-recruiters-38 | DONE (source, tests not run) | `src/modules/placements/tpo-recruiter-lead-policy.ts` excludes common private-email providers including icloud/protonmail and capitalizes inferred employer first label, named test in `tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts`. |

| TPO-recruiters-39 | PARTIAL — OPEN | `src/components/tpo/recruiter-leads-workspace.tsx` restores concise view count and retained Add recruiter lead action; named test `tests/unit/chat2-tpo-recruiter-leads-copy.test.ts`. Other landing page sections remain. |
| TPO-recruiters-40 | PARTIAL — OPEN | `src/components/tpo/recruiter-lead-detail-workspace.tsx` now uses "Edit contact details" and "Save" with existing recruiter leads back link; named test in same file. |
| TPO-recruiters-43 | DONE (source, tests not run) | Table and board show designation and "Unnamed contact" fallback without hiding recruiter actions; named test in same file. |
