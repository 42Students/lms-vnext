# LMS vNext — Account Parity Continuation Handoff

**Date:** 2026-10-04  
**Repository:** `42Students/lms-vnext`  
**Branch:** `main`  
**Pre-parity baseline:** `ce564b60dac0c2db6a7bb7698257285e1664c0d1`  
**Legacy UI baseline:** `42Students/lms2-fe@prod-2026` @ `38cdd38e592a6f416c8e8e99ce36438f548ed577`

## Locked product decision

Use **clone-first, redesign-later** for Learner, Faculty, Mentor, College Admin, Super Admin, TPO and HR/Recruiter.

Recreate every meaningful legacy page, tab, section, action, modal and workflow, but implement with the vNext architecture. Nothing disappears silently.

Detailed tracker: `docs/planning/account-surface-parity.md`.

## Continuation order

Learner → Faculty → Mentor → College Admin → Super Admin → TPO → HR/Recruiter → shared Identity/Storage blockers → final fresh legacy diff → browser regression sweep → UI/UX redesign.

## Every future chat must

- fetch latest `lms-vnext/main` and `lms2-fe/prod-2026`;
- preserve parallel work; never force-push;
- read AGENTS, master plan, execution checklist and account parity matrix;
- start at the first unresolved row for the active account;
- inspect the exact legacy page before implementing it;
- update the parity matrix in the same commit;
- keep tenant authorization centralized;
- never call authored tests “green” unless CI actually executes them.

## Current CI boundary

Recent CI runs fail before any job steps start (no runner/steps). This is a verification blocker, not a reason to stop non-cloud parity implementation.

## Immediate implementation sequence

Start Learner with surfaces already backed by vNext data:
1. Class Schedule.
2. Learner self Profile.
3. Attendance/Course Attendance.
4. Course Discussions.
5. Placement subpages + Career Calendar.
6. Exact Course and Project section parity.

Closed in Learner parity batch 1:
- Global Assignments
- Global Quizzes
- legacy-compatible late assignment submission behavior

Then move immediately to Faculty.
