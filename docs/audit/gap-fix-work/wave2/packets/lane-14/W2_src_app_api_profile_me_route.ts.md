# Work packet (wave 2): edit src/app/api/profile/me/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md

## G2-1-004-001  [P2] GAP  facet F01  effort M
- Legacy: `LearnerProfileController.java:27-31,328-1237` exposes `/api/v1/profile/learner/{learnerId}/{section}` for authorized actors.
- vNext now: `src/app/api/profile/me/route.ts:13-49` uses `/api/profile/me` own profile; `learn/profile/page.tsx:20-56` presents `/learn/profile`.
- Fix: Map section deep links and old clients to self vs admin routes, with role-aware redirects.
