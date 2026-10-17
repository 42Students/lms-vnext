# TPO Recruiters – chat-2 round 6

| Gap | Status | Evidence |
| --- | --- | --- |
| TPO-recruiters-38 | DONE (source, tests not run) | `src/modules/placements/tpo-recruiter-lead-policy.ts` excludes common private-email providers including icloud/protonmail and capitalizes inferred employer first label, named test in `tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts`. |

| TPO-recruiters-39 | PARTIAL — OPEN | `src/components/tpo/recruiter-leads-workspace.tsx` restores concise view count and retained Add recruiter lead action; named test `tests/unit/chat2-tpo-recruiter-leads-copy.test.ts`. Other landing page sections remain. |
| TPO-recruiters-40 | PARTIAL — OPEN | `src/components/tpo/recruiter-lead-detail-workspace.tsx` now uses "Edit contact details" and "Save" with existing recruiter leads back link; named test in same file. |
| TPO-recruiters-43 | DONE (source, tests not run) | Table and board show designation and "Unnamed contact" fallback without hiding recruiter actions; named test in same file. |

| TPO-recruiters-07 | PARTIAL — OPEN | Engage Needs doing now uses persisted Follow-ups due, No next step, Gone quiet and Unassigned counts, hides zero chips, shows Nothing right now, and links to active recruiter access; named `tests/unit/chat2-tpo-recruiter-needs.test.ts`. Toggle persistence and other legacy counts remain. |
| TPO-recruiters-39 | DONE (source) | Legacy first-run empty message and count/add action; named `tests/unit/chat2-tpo-recruiter-needs.test.ts`. |

| TPO-recruiters-41 | DONE (source, tests not run) | `tpo-bulk-lead-stage-model.ts` accepts confirmed NEW and keeps derived recruiter stages separate. `tpo-bulk-lead-stage-service.ts` clears Not Now fields, records row audit and retains existing five-minute undo. UI exposes Restore to New. Named `tests/unit/chat2-tpo-recruiter-bulk-new.test.ts`. |

| TPO-recruiters-42 | DONE (source, not run) | Last successful leads and companies snapshots survive errors, with separate Retry warnings. Named `tests/unit/chat2-tpo-recruiter-stale-refresh.test.ts`. |

| TPO-recruiters-24 | DONE (source, not run) | Allowed source labels include imported leads and Zod rejects invalid source with meaningful choices, named `tests/unit/chat2-tpo-lead-modal-source.test.ts`. |
| TPO-recruiters-30 | PARTIAL — OPEN | Edit modal uses field-specific friendly conflict/validation messages and legacy labels; duplicate peer link pending. Named test. |
| TPO-recruiters-36 | PARTIAL — OPEN | Edit and Not now dialogs now trap Tab and close on Escape without unguarded action; board mobile actions/layout still pending. Named test. |

| TPO-recruiters-22 | DONE (source, not run) | Verified existing dual email/phone preflight and explicit link to the named existing lead with disabled duplicate create, named `tests/unit/chat2-tpo-recruiter-existing-contacts.test.ts`. |
| TPO-recruiters-R06 | DONE (source, not run) | Unsubscribed/Not Now invite panel shows the exact legacy warning and disables inviting opted-out people, named test in same file. |

| TPO-recruiters-R02 | DONE (source verified, unrun) | Companies rendered independently of empty lead view, grouped and filtered against actual companies. Named regression in `tests/unit/chat2-tpo-engage-companies-independent.test.ts`. |

| TPO-recruiters-07 | DONE (source; not run) | Exact nonzero Needs doing chips (follow-ups due, no next step, gone quiet, unassigned), collapse toggle, empty sentence, working filter and recruiter-access count; `tests/unit/chat2-tpo-recruiters-needs-toggle.test.ts`. |
