# Lane chat-18 gap-fix proof

- docs/audit/gap-fix-work/packets/lane-2/src_app_api_placements_registration_route.ts.md | G2-16-023-025 applied: registration POST now returns legacy `ok:true` together with the existing choice/version response; existing success copy remains `LEARNER_REGISTRATION_COPY.success` in the caller; no caller breaking change. No skip.
- docs/audit/gap-fix-work/packets/lane-2/src_modules_placements_tpo-workspace-access-model.ts.md | G2-20-021-010 applied: workspace access now explicitly distinguishes sign-in required (401), inactive/missing membership (403), and missing scoped placements.manage (403), preserving admin guest read access vs TPO tooling and reminding handlers to check job/round scope. No skip.
