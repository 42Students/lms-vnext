# U025 — PublicShareController

Legacy docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java and docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java; new src/modules/placements/company-share/public-service.ts, src/modules/placements/company-share/access-service.ts, src/app/company-share/[token]/page.tsx, src/app/api/placements/company-share/[token]/export/route.ts, src/modules/placements/company-share/token-model.ts. No CI.

| ID | Facet | Legacy | vNext | Verdict | Severity | Fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-20-025-001 | F01 | Old 5 routes docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:27-56 | New page, CSV [F:17-23,E:8-17] | GAP | P2 | Map URLs | M |
| G2-20-025-002 | F02 | Pre-code company/role docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:115-120 | Code prompt only src/app/company-share/[token]/page.tsx:29-44 | GAP | P2 | Show context | S |
| G2-20-025-003 | F03 | Send code email docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:37-40 | Only manual code src/app/company-share/[token]/page.tsx:31-43 | MISSING | P1 | Add email code | M |
| G2-20-025-004 | F04 | Projects/skills columns docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:25 | New chosen fields differ src/modules/placements/company-share/token-model.ts:10-16 | GAP | P2 | Map columns | M |
| G2-20-025-005 | F05 | Old full rows docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:184-201 | Page25 CSV500 src/modules/placements/company-share/public-service.ts:100-120 | GAP | P2 | Show truncation | S |
| G2-20-025-006 | F06 | Old POST code docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:32-35 | 6digit form proof src/app/company-share/[token]/page.tsx:35-43 | GAP | P2 | Match code input | S |
| G2-20-025-007 | F07 | 404 SHARE_INVALID docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:23-25 | Invalid UI and code failure src/app/company-share/[token]/page.tsx:33-51 | GAP | P2 | Uniform response | S |
| G2-20-025-008 | F08 | Old open returns rows docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:32-35 | Proof cookie then data src/modules/placements/company-share/access-service.ts:59-64 | GAP | P3 | Show success | S |
| G2-20-025-009 | F09 | No server modal docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:16-21 | Inline code form src/app/company-share/[token]/page.tsx:29-44 | MATCH | P3 | N/A | S |
| G2-20-025-010 | F10 | Download event recorded docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:53-56 | VIEW/CSV audit src/modules/placements/company-share/public-service.ts:108-113 | GAP | P2 | Map activity | S |
| G2-20-025-011 | F11 | Token+code access docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:12-14 | Bound proof cookie src/modules/placements/company-share/public-service.ts:26-38 | EXTRA | P2 | Keep proof | S |
| G2-20-025-012 | F12 | 7day expiry docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:14-16 | Default2d src/modules/placements/company-share/token-model.ts:7-9 | GAP | P2 | Align default | S |
| G2-20-025-013 | F13 | Invalid 404 docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:23-25 | Outage retry vs expired src/app/company-share/[token]/page.tsx:24-51 | EXTRA | P3 | Keep distinction | S |
| G2-20-025-014 | F14 | Resumes ZIP docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:42-50 | Only CSV src/app/api/placements/company-share/[token]/export/route.ts:8-17 | MISSING | P1 | Add ZIP | L |
| G2-20-025-015 | F15 | Code email 5/hour docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:156-180 | No send-code UI src/app/company-share/[token]/page.tsx:31-43 | MISSING | P2 | Restore throttle | M |
| G2-20-025-016 | F16 | No backend CSS docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:16-21 | Responsive table/cards src/app/company-share/[token]/page.tsx:62-67 | EXTRA | P3 | Keep mobile | S |
| G2-20-025-017 | F17 | No backend ARIA docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:16-21 | Accessible labels src/app/company-share/[token]/page.tsx:35-43 | EXTRA | P3 | Keep labels | S |
| G2-20-025-018 | F18 | Invalid exact text docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:23-25 | Exact heading match src/app/company-share/[token]/page.tsx:46-51 | MATCH | P3 | No change | S |
| G2-20-025-019 | F19 | Unpaged legacy docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:184-201 | Page25 export500 src/modules/placements/company-share/public-service.ts:100-120 | GAP | P2 | Show totals | S |
| G2-20-025-020 | F20 | Wrong code lock10/hour docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:122-140 | Row lock and notification src/modules/placements/company-share/access-service.ts:31-55 | EXTRA | P2 | Keep guard | S |
| G2-20-025-021 | F21 | TpoMail sends code docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:156-180 | No mail in access flow src/modules/placements/company-share/access-service.ts:12-67 | GAP | P2 | Decide code delivery | M |
| G2-20-025-022 | F22 | Old hashed share state docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:49-64 | New token/lock tables src/modules/placements/company-share/public-service.ts:41-68 | GAP | P2 | Map DDL | L |
| G2-20-025-023 | F23 | Watermark new src/app/company-share/[token]/page.tsx:63-80 | Old raw API docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:184-201 | EXTRA | P2 | Keep watermark | S |

## Unit summary

Rows 23; MATCH 2, GAP 12, MISSING 3, EXTRA 6, UNKNOWN 0; P0 0, P1 2; top gaps: email-code, resume ZIP, expiry. Check live old share links.
