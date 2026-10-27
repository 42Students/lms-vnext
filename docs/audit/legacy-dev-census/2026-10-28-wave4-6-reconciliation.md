# 2026-10-28 legacy imported UI descendants — waves 4–6 closure and reconciliation

> **Static discovery checkpoint, not functional acceptance or a second project tracker.**
> Official task states remain in `docs/tracker.json`; page-family acceptance remains in `docs/parity/*.md`. No vNext page was marked Implementation Green by this work.

## Revisions and method

- Legacy FE oracle: `42Students/lms2-fe@lms-dev-2026` at `9d56bb7a347b06f242ef615c19fdc298f83329e0`.
- Legacy BE oracle: `42Students/lms@lms-dev-2026` at `ecb09416b107e82e5ac7d22f3bc94a85258754b3`.
- Source parity comparison sample: `42Students/lms-vnext@f8231663c0ed30a2473e26d59527e30d33c8bc72`.
- Reused the wave-1/2/3 evidence (248 previously inspected distinct descendant source paths) and post-wave-3 190-candidate frontier without restarting route/source inspection.
- Wave 4: 190 SHA-pinned source reads, recorded in 14 files `2026-10-28-import-reachability-wave4-{a..n}.json`; 497 resolved literal local import edges, 36 new UI-folder imported modules.
- Wave 5: inspected all 36 new UI-folder modules; saved 3 files `2026-10-28-import-reachability-wave5-{a..c}.json`; 10 further UI-folder imports.
- Wave 6: inspected all 10 further UI-folder modules; saved `2026-10-28-import-reachability-wave6-a.json`.
- New snapshot totals: **484 distinct reachable-code source files represented by the combined inspection waves**. Existing route-source census remains **313 legacy route files**, **not** 313 accepted pages or necessarily additional distinct files.
- Current **tree-resolved imported UI-folder candidate frontier = 0** under the stated static parser/scope, as recomputed in `2026-10-28-derived-import-frontier-post-wave6.json`. This is a **finite stop gate for this scoped import worklist**, NOT a proof that no legacy surface remains.

## Independently asserted source facts

- All 236 newly fetched source paths across waves 4/5/6 are unique relative to the 248 previous inspected paths, and all match the pinned FE source tree SHA.
- No requested GitHub source read failed and no tree-resolvable static local import specifier was recorded unresolved in the wave-4 UI-folder frontier; after following wave-5/6, no additional UI-folder JavaScript/TypeScript module appears in that parser's frontier.
- Wave-4 classification is *source-level JSX/control candidate* only: 120 UI-rendering candidates, 9 interactive hooks, 61 nonvisual helpers **before manual correction**. One `auditFindingsModel.js` false-positive UI classification was corrected; the final source record is authoritative.
- Wave-5 and wave-6 classifier corrections are documented inline in their final JSON: `ResilientAvatar.jsx` and `PrivateDocLink.jsx` render JSX despite the line parser undercounting tags; `tpoRecruiterTheme.js` is a theme/config utility rather than a separate interface.
- Non-UI-folder dependencies are **not** automatically exempt from service authorization or workflow auditing. The wave-4 and wave-5 derived records retain additional imports outside UI folders; wave-6 excludes five direct service/storage helpers (AdminService, VerificationService, SkillService, ProfileService, uploadToR2) from the UI-component frontier but explicitly preserves them as **behavior and storage verification leads**.

## New child-surface families requiring acceptance reconciliation

| Owning existing parity spec/family | Source candidates newly followed | Evidence-backed test obligation; do not assert missing/equivalent |
|---|---|---|
| Learner and relevant staff profile pages | `src/components/profile/about.js` delegates into contact, experience, skills, identity, qualifications, projects, certifications, achievements, languages, extracurricular, social profile, address, details, hobbies, publications, awards and metadata editors; `userInfo.js` and `ProfileCompleteness.js` add lifecycle and visibility | Map each conditional form, fields, validation, save/discard, unsaved guards, staff-versus-self edit rights, history/readback and private-document visibility to vNext `src/components/profile/learner-profile-workspace.tsx` or a justified consolidated successor. Exact source components do not imply 18 new page families. |
| Learner profile media / private evidence | `src/components/profile/VideoIntroModal.jsx` source contains camera-permission, countdown, record/preview/upload and cancel states, max 2-minute recording and max 50-MB file. `about/MarksheetUpload.jsx` constrains PDF/JPG/PNG to 5 MB (L17–19). `PrivateDocLink.jsx:L23,L42-L43` delegates secured signed-link opening; `Global/SkillsAutocomplete.jsx` supports catalog behavior | Verify approved retention/recording/privacy disposition for video introduction; vNext workflow reachability; identity/marksheet secure receipt, replacement, staff visibility, R2 failure/retry, file type/size and credential isolation; skill catalog recent/popular/proficiency keyboard semantics. VNext `src/modules/people/learner-profile-document-edit-service.ts` and private receipt modules are **source evidence only**. Do not claim that filename search proves a feature missing. |
| Learner placement and jobs | `Placements/JobDetailContent.jsx`, `JobsListContent.jsx`, student `ScheduleCard.jsx`, `OfferCard.jsx` and `RoundTrack.jsx` expose nested candidate states beyond list routes | Confirm eligible/apply, round state, offer expiry, company information, scoped job detail deep links, and withdrawn or blocked negative states end-to-end. |
| Faculty/Admin academic workspaces | Legacy `pages/Dashboard/course/syllabus/{liveclass,resource,video,youtube,syllabusDetail}.js`, `Quiz/Table/{table,action,quizeTitle,submission}.js`, and Super Admin `sections/{Faculty,Students,Courses,LessonContent,Attendance,Quizzes,SemesterManagement,SemesterCourseMapping,...}.js` have dynamic editors and action controls | Reconcile actual nested form/viewing states and role scope against vNext consolidated course, quiz, report and academic workspace behavior, not only matching route titles. |
| TPO communications and command finder | `src/components/tpo/TpoBellPanel.jsx`, `TpoCommandPalette.jsx:L8,L95-L139`, `ui/{recents,shortcuts,ShortcutHelp}.js/jsx`, `emails/EmailDetail.jsx`, `outreach/OutreachSession.jsx`, `TodayQueue.jsx`, `TeamConversations.jsx` | Verify Ctrl/Cmd+K keyboard and grouped student/recruiter/company/drive search, selection, recents, tenant filtering, dialog focus and close; scoped notification read/clear/deep links; sending, delivery, messaging, errors and role-to-role side effects. |
| Shared/Public/Operations | `marketing/{MarketingHeader,MarketingFooter}.jsx`, `contacts/ContactsGrid.js`, global/mobile/profile dropdowns, tracker issue and error drawers | Test navigation guards, keyboard/focus mobile responsiveness, public routing, deep links, error/offline/retry, and notification/issue privacy. |

### Priority verified comparison leads (not a missing-feature verdict)

1. **TPO request kinds and decisions.** Legacy `src/components/tpo/RequestsPanel.js:L24-L30` lists seven kinds and `L195-L270` handles confirmation, proof-sensitive bulk skips and failed decisions. VNext `src/modules/placements/tpo-global-requests-model.ts:L4` declares `ALL/APPLICATION_WITHDRAWAL/ROUND_RESCHEDULE/OFFER_EXTENSION`; `src/modules/placements/tpo-students-service.ts:L179` parses three request kinds. However there are also separate vNext general-request and bulk-decision implementations; reconcile the entire request family, DB persistence and cross-account consumers before marking any kind absent.
2. **Profile private media.** Legacy video-intro and marksheet forms are substantive *nested* interfaces, while current vNext profile source and receipt system need explicit scenario-by-scenario acceptance. Treat camera permission failure, upload cancel/replacement, private link expiry, tenant/owner mismatch as mandatory tests or approved retirements.
3. **Super Admin reusable sections.** A route importing `sections/Faculty.js` does not certify Faculty assignment, course or attendance subtree. All child drawers, filters, save, validation and role scopes must be reconciled.
4. **TPO command finder.** The palette supports cross-entity navigation and recent items. Check vNext route and keyboard behavior, not only the TPO topbar button.
5. **Shared global providers.** Earlier wave-3 discovered offline/reconnected, notifications and mobile drawers. Verify global mounting, feature/tenant variants and tab/focus management separately from this import graph.

## Explicit incompleteness / finite handoff

The **static UI-folder imported-source discovery worklist is exhausted** at the pinned FE SHA. Remaining **different** work is substantial and is NOT implicitly closed:

- Inspect and classify any dynamic/computed import destinations, lazy bundles or provider-registered UI not captured by literal static import parsing. Record exact exceptions rather than restarting the same 484 sources.
- Reconcile frontend API/services and the retained outside-UI-folder dependencies against backend authorization, domain services, persistence, notifications, private storage, feature/tenant gating and cross-role outcomes.
- Qualify UI *surface instances*, distinct actions and applicable states under the existing stable parity family IDs. Source files are not a meaningful page-count denominator.
- Compare against current vNext behavior and run disposable PostgreSQL, focused unit/integration and desktop/mobile/keyboard browser acceptance. No such executable product acceptance was run in this session. No page was marked Implementation Green and `docs/tracker.json` was not changed.
- At release time the established clone-parity protocol still requires separate production-branch verification; the development branch is not a substitute.

**Next precise starting gate:** use this reconciliation and the zero static UI-folder frontier to stop repeating import file inspections; begin targeted source-to-service/back-end parity verification with TPO student-request kinds, learner profile private media, Super Admin nested academic editors and the TPO command finder. Escalate only proven missing behaviors or source-drift exceptions to the owning existing parity spec.
