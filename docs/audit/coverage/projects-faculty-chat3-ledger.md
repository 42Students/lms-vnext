# Projects — Faculty account role journey (chat-3, IIT Dharwad)

Source authority: `docs/orchestrator/briefs/projects-iit-dharwad-hardening.md`. Faculty and Mentor are different membership roles, even when one person holds both. A Faculty teaching appointment is not a Project Mentor grant and must never yield project detail, roster, grading or write authority on its own.

The main Projects module ledger belongs to chat-14. This lane-specific ledger records the Faculty role boundary and delegated hand-off. Cases below were written against real entry points and are **not claimed to have run**. A real PostgreSQL role-revocation and browser session walkthrough remain prerequisites for runtime acceptance.

| Project boundary | Entry point | Behavioural test | Cases / permission matrix |
| --- | --- | --- | --- |
| `src/modules/projects/access.ts` | `requireProjectReadAccess` | `tests/unit/PROJ-BREAK-chat3-faculty-role-journey.test.ts` | PROJ-BREAK-chat3-FACULTY-01: Faculty-only denied before SQL; active Faculty+Mentor requires a persisted current Mentor project member; wrong role, removed member, disabled account, suspended membership, wrong college and organization all denied; admin scoped separately |
| `src/modules/projects/access.ts` | `requireProjectManageAccess` | same file | Faculty-only denied before SQL; College Admin may manage only own college; wrong college denied |
| `src/modules/projects/access.ts` | `requireProjectLifecycleAccess` | same file | Only Admin or mutable Mentor grant; Observer, disabled mutation flag, and invalid roleKind refuse writes |
| `src/modules/projects/access.ts` | `requireProjectLifecycleMutationAccess` | same file | Requires a current mentor/admin role, project grant and enabled Projects module; does not substitute the teaching Faculty role |
| `src/app/(authenticated)/mentor/layout.tsx` | default `MentorLayout` | `tests/unit/PROJ-BREAK-chat3-faculty-mentor-route-jouneys.test.tsx` | PROJ-BREAK-chat3-FACULTY-02: Faculty-only, disabled, suspended and Learner do not enter Mentor routes; real dual-role principals enter |
| `src/app/(authenticated)/teacher/layout.tsx` | default `TeacherLayout` | same file | Mentor-only, disabled, suspended and Learner do not enter Faculty lessons; dual-role enters and gets accessible skip link |

## Faculty versus Mentor versus Learner

| Principal | Faculty course pages | Project detail read | Project mutation |
| --- | --- | --- | --- |
| Active Faculty only | Yes, assigned teaching Section only | No | No |
| Active Mentor only | No | Only as current scoped project Mentor member | Only with current mutable Mentor/Co-Mentor project role, enabled module, persisted transaction authorization |
| Active Faculty + Mentor | Yes, assigned teaching Section | Only with independently granted project Mentor membership | Same Mentor grant and mutation constraints; Faculty grant adds no authority |
| Active Learner | No | Only as current learner project member with enabled Projects | Learner-only submission/task actions, subject to persisted role and project constraints |
| College Admin | No | Selected own-college projects | Authorized own-college project management |
| Global Super Admin | Not by virtue of system role alone | Within chosen platform scope | Authorized project administration within selected scope |
| Disabled user or suspended college membership | No | No | No |

## Unresolved release gates

- Live transaction test: revoke the Project Mentor grant while a Faculty/Mentor tab remains open, then attempt to mutate; the persisted transaction must fail and no activity/notification may be written.
- PostgreSQL fixtures: cross-college project IDs, wrong-organization membership, ended project role, observer and archived project, module disabled, stale revision and concurrent write.
- Page and API journey: direct `/mentor` URLs and write endpoints (same-origin and payload bounds), denied roles, refresh, 320px layout, network recovery and friendly errors. This role test is not an assertion of all 258 Project module service exports.
- Project lead and integration harness owner: chat-14 / chat-17. No schema or migration changes proposed by chat-3 for the Faculty role boundary.
