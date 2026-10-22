# Lane 8 W1 verification 1 — source review

Verified against the legacy references in `W1_lane8_1.md` and vNext source at the branch revision. Fixes above are authored; **no TS/CI/DB/browser tests were run**. Files requiring live persistence/legacy migration acceptance remain conditional. IDs with `OK` had already received their source-level fix on main.

| Audit row | Result | Source assessment |
| --- | --- | --- |
| G2-14-024-012 | FIXED | Actual selected-college PUBLISHED/SUBMITTED/ISSUED/BOOKED counts read with persisted Super Admin authorization before disable preview |
| G2-13-026-012 | OK | Legacy DTO validator accepts positive source program IDs, required bounded name, optional 255-character date strings, course IDs and status; UUID mapping remains explicit |
| G2-19-030-005 | OK | TPO profile renders avatar/identity card and student/recruiter-facing summary |
| G2-10-006-025 | FIXED | Slot semester number and academic identity editable until enrollment history locks fields |
| G2-10-006-045 | FIXED | Existing slot edit sends expectedVersion with academic identity fields |
| G2-10-006-050 | FIXED | Slot edit receives hasEnrollmentHistory from directory and locks only historical fields |
| G2-10-006-069 | FIXED | Scoped SQL count and LIMIT/OFFSET drive all pages; case-insensitive description search; no double client slice |
| G2-10-008-036 | OK | Department selection resets program and batch in controlled admin filters |
| G2-10-017-048 | FIXED | Scoped deadline extension checks previous deadline under row lock, never overwrites stale action and records source audit |
| G2-10-018-047 | OK | Lecture-hall archive intentionally preserves history rather than hard delete |
| G2-10-018-055 | OK | Hall create/edit caps at 1–1000 and documents legacy backend's larger historical range |
| G2-10-018-056 | OK | Initial loading and department options have distinct retry/error surfaces |
| G2-10-018-086 | OK | Hall historical restoration/dependency semantics explicitly documented |
| G2-10-020-012 | OK | Program row has inline SVG Edit and red destructive Delete controls |
| G2-10-020-042 | OK | Archive failure retains per-row confirmation and visible retry |
| G2-10-020-057 | OK | Program delete route translates to checked archive; history and FKs retained |
| G2-10-020-069 | OK | Owner-directed archive-vs-delete divergence exposed in action and restore path |
| G2-10-020-102 | OK | Dependency blockers and restore conflict checks preserve historical identity |
| G2-10-023-022 | OK | Tenant setup embeds searchable paginated organization table |
| G2-17-026-002 | FIXED | Documented course/class notification audience conversion and legacy inbox deep-link redirect; SSE parity remains explicit acceptance gap |
| G2-11-002-017 | FIXED | Time-stamped pending interview rounds included alongside scheduled/completed |
| G2-11-002-075 | OK | Recruiter reply form propagates selected quoteId into request |
| G2-11-006-012 | OK | Audit compatibility includes id, action, entity type, normalized detail and actor labels; actorId intentionally null for privacy |
| G2-11-006-027 | OK | Four f_* multi-selection facets OR within and AND across |
| G2-11-006-039 | OK | Audit source unions, 500/5000 snapshot limits, export counts and typed compatibility read documented |

Preserved deliberate history-retention divergence (archived instead of physical delete) and scoped authorization. Audit actor UUIDs are intentionally not shared; this is a privacy compatibility projection rather than literal legacy ID exposure.
