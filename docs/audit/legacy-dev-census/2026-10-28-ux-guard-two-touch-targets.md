# UX anti-drift CI touch targets — 2026-10-28

GitHub Actions run 40583739030 reports ESLint 0 errors and 308 existing warnings, then fails `npm run ux:guard` because two changed surfaces had under-44px phone touch targets.

- `src/components/courses/learner-course-discussion.tsx`: the moderate course-discussion composer now has a minimum 44px height instead of 40px. It retains responsive layout and remains an editable multi-line input.
- `src/components/tpo/recruiter-prototype-roster.tsx`: the recruiter cell container and, more importantly, its actionable name button now have a 44px minimum phone target, with compact desktop height restored at `md`.

No baseline waivers, scripted guard changes or ESLint rule relaxations. Validate on the next CI lint/UX job and responsive browser. These are focused accessibility fixes, not full page acceptance.
