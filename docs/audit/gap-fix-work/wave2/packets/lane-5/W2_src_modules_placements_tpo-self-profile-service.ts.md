# Work packet (wave 2): edit src/modules/placements/tpo-self-profile-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-015  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:54 — department comes from faculty detail, rendered as text.
- vNext now: src/modules/placements/tpo-self-profile-service.ts:90-107,153-162 — linked facultyProfiles.primaryDepartmentId under current membership/college.
- Fix: Map legacy department and multi-department display with tenant-safe join.

## G2-19-030-031  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:44-48 and docs/legacy-source/frontend/src/api/Services/UserServices.js:12-20 — GET getFacultyDetails({facultyId:loginUser.id}), expects nested data.data.
- vNext now: src/modules/placements/tpo-self-profile-service.ts:58-139 — server SQL select by current membership/user, no faculty ID from client.
- Fix: Preserve visible fields with strict current-user scope and safe data projection.

## G2-19-030-062  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/profile.js:44-50 — numeric facultyId and nested old faculty response.
- vNext now: src/modules/placements/tpo-self-profile-service.ts:110-139 — UUID membership/user/college IDs, joined persisted roles.
- Fix: Document numeric faculty-ID → membership UUID crosswalk.
