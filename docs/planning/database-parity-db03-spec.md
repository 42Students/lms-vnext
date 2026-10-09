# DB03 — Groups + Electives schema contract

**Status:** DESIGN STARTED; no generated migration or DB execution yet.
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`; migrations V166/V167/V168/V191 and Java entities `LmsGroup`, `LmsGroupMember`, `LmsGroupMemberEvent`, `LmsGroupRule`, `ElectiveSlot`, `ElectiveOffering`.

## Required domain model

| Target concept | Legacy persistent semantics / proposed vNext |
| --- | --- |
| Group | `kind` (opaque to kernel), platform-or-college owner, status DRAFT/ACTIVE/CLOSED/ARCHIVED, capacity, atomic active_count, join window, academic context, versioned JSONB config, creator, archive |
| Group member | unique `(group_id,membership_id)` for all states; REQUESTED/ACTIVE/WAITLISTED/REMOVED, MANUAL/CSV/RULE/SELF, is_locked, joined_at, waitlist priority, note, version |
| Member event | append-only transition history with actor, state from/to, source, reason, timestamp |
| Group rule | one rule/group, JSONB criteria+schema version, auto-refresh, last-run metrics; rule refresh cannot modify locked/manual decisions |
| Elective slot | college/program/term, credits, min_pick, max_pick, name, status, version; min_pick <= max_pick |
| Elective offering | slot + course + ELECTIVE group + backed class/delivery, optional capacity; unique group and backed class; lifecycle/version |
| Group-backed roster | one common authoritative roster resolver shared by course access, lecture content, attendance, assessments and grading; preserve normal learner section enrollment |

## Critical mapping decision

Legacy group-backed classes allow elective learners from other programs without moving their primary enrollment. vNext `sections` are strongly tied to cohort/academic period, and `section_enrollments` expects a learner program enrollment. **Do not implement electives by forcibly changing the learner's primary section.** Inspect all roster producer/consumer queries, then design an explicit group-backed roster link/union that preserves role/tenant boundaries and historical reads.

## Correctness requirements

- Atomic seat claim/leave and active_count change + member event in one transaction. Retry conflicts deterministically.
- For max_pick=1, two simultaneous joins to different groups under the same elective slot must not both succeed. Lock the slot or enforce a common learner/slot guard, not just the individual group rows.
- Group owner scope and member/program/section/course college must agree; do not trust client-submitted parent IDs.
- Rule reruns must be idempotent, preserve manually locked/removed state, and reconcile group active_count.
- Historical REMOVED membership remains a record, never hard-deleted; event history is immutable.
- Type-safe CHECK/ENUM on statuses, positive capacity/credits, pick bounds, time window order, and scoped FK/indexes.
- Project TEAM groups must be mirrored transactionally to project membership without creating competing owners of truth.

## Adversarial test checklist

- [ ] concurrent last-seat claims do not overbook;
- [ ] parallel elective choices honor max_pick across offerings;
- [ ] locked removal rejects self-join and rule-based rejoin;
- [ ] rule refresh preserves manual/CSV decisions;
- [ ] group-owned roster drives the same attendance/quiz/content authorization;
- [ ] learner keeps primary section unchanged after elective enrollment;
- [ ] cross-college forged IDs are rejected;
- [ ] archive/reopen and waitlist promotion preserve membership history;
- [ ] project-team member mirror and source state agree under rollback;
- [ ] generated Drizzle schema, migration snapshot, PostgreSQL replay, and unit/integration/E2E evidence are recorded.

Completion demands a generated migration (`npm run db:generate`), real DB verification, and every legacy field in `database-parity-hotspot-field-ledger.json` either mapped and tested or explicitly approved for redesign/retirement. **No schema has been changed in this planning batch.**
