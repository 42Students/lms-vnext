# Work packet (wave 2): edit src/app/(authenticated)/tpo/announcements/page.tsx (part 2 of 2)

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-announcements.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md, docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-11-005-114  [P2] GAP  facet F18  effort S
- Legacy: Message label Announcement `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:96`
- vNext now: Label Message `src/app/(authenticated)/tpo/announcements/page.tsx:124`
- Fix: Exact label

## G2-11-005-116  [P2] GAP  facet F18  effort S
- Legacy: Checkbox Pin it to the top `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:162`
- vNext now: Pinned `src/app/(authenticated)/tpo/announcements/page.tsx:240`
- Fix: Exact label

## G2-12-023-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:19-35`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:35-50`
- Fix: Legacy controller base /api/v1/tpo/announcements and GET mine; vNext /tpo/announcements SSR page backed by scoped read service and separate POST API.

## G2-12-023-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:39-48`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:60-109`
- Fix: Legacy GET /audiences and POST /preview, vNext server-rendered target options/GET query preview form; preserve API compatibility where needed.

## G2-12-023-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:33-42`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:86-110`
- Fix: Legacy API headless list and audience options consumed by client composer; vNext PageHeader/dialog/preview block with tabs and article cards.

## G2-12-023-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:84-95`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:154-181`
- Fix: Legacy from42 separate API list with GET mark-as-read effect; vNext From 42 tab New badge and explicit acknowledgment action.

## G2-12-023-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:32-35`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:154-158`
- Fix: Legacy mine uses own college student announcements; vNext tab titles To your students / From 42 / Recently removed with mine versus team switch.

## G2-12-023-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:45-47`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:92-109`
- Fix: Legacy audience preview supports per-audience count and emailReady; vNext Current [kind] visibility preview count and estimate warning, different copy.

## G2-12-023-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:67-72`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:152-152`
- Fix: Legacy undo status UNDONE in response; vNext toast Undo send countdown and route redirects, different confirmation text.

## G2-12-023-031  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:50-58`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:87-150`
- Fix: Legacy draft/edit handlers feed AnnouncementComposer modal; vNext typed Dialog plus nested audience preview form and edit drawer/form, compare close/dirty guard.

## G2-12-023-033  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:67-72`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:152-152`
- Fix: Legacy in-progress undo click within 30s directly POST; vNext toast countdown and lifecycle form action with expectedVersion.

## G2-12-023-047  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:111-125`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:170-173`
- Fix: Legacy list can return [] as true no announcements; vNext NOT_REGISTERED distinct from empty. Preserve explicit outage state.

## G2-12-023-051  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:25-30`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:90-90`
- Fix: Legacy email flag exists but emailReady=false per owner; vNext explicitly no email or SMS. Mark as intentional disabled channel rather than silently drop parameter.

## G2-12-023-059  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:93-96`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:154-158`
- Fix: Legacy From 42 unread badge counts faculty-specific, vNext labels From 42 (N) for college-specific count.

## G2-12-023-060  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:99-107`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:106-109`
- Fix: Legacy preview `withEmail`/`emailReady` vs vNext potentiallyVisibleMemberships and estimate text, exact count semantics differ.

## G2-12-023-074  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:33-82`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:87-154`
- Fix: Old REST list/audiences/preview and undo/delete paths not direct-compatible with vNext server-rendered forms and versioned lifecycle; adapters if external callers exist.

## G2-19-031-040  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:90-97` — Notice title max200 and body max8000 with live showCount.
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:122-125` — Limits match but new body lacks visible live counter.
- Fix: Show message character counter.

## G2-19-031-105  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:57-70` — Announcement live reach is aria-live status.
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:107-109` — New reach text requires Preview click and status semantics unclear.
- Fix: Announce count/loading/errors politely.

## G2-19-031-111  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:94-97` — Notice placeholders Omega pre-placement talk on Monday; body HTTPS help.
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:122-125` — New fields lack shown exact legacy placeholders.
- Fix: Add placeholders/help/counter.

## G2-19-031-112  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:162-165` — Pin it to the top wording.
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:144-144` — New label Pin this notice.
- Fix: Rename exact old label.

## G2-11-005-119  [P3] GAP  facet F19  effort S
- Legacy: One GET list and one GET unread badge on load `docs/legacy-source/frontend/src/pages/tpo/announcements.js:37`
- vNext now: Server read + target audience/readiness queries, counts `src/app/(authenticated)/tpo/announcements/page.tsx:35`
- Fix: Audit query count/caching for large TPO colleges

## G2-12-023-058  [P3] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:61-72`
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:150-152`
- Fix: Legacy return codes DELETED/UNDONE, vNext Deleted. Its notices were taken back. and Undo send label/toast copy.
