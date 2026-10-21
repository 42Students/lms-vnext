# Work packet (wave 2): edit src/components/courses/learner-course-workspace.tsx (part 1 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/youtube.md, docs/audit/gap2/lane-15/u008-syllabus-detail.md, docs/audit/gap2/lane-16/u008-learner-syllabus.md, docs/audit/gap2/lane-17/legacy-resource-viewer.md

## G2-12-008-001  [P2] GAP  facet F01  effort S
- Legacy: Legacy YoutubeVideo component embedded inside syllabus with learner and faculty behaviors `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:50-57`
- vNext now: VNext only LearnerYouTubePlayer in course content workspace; faculty video editor elsewhere `src/components/courses/learner-course-workspace.tsx:34-35,273-291`
- Fix: Provide identical embedded header/actions for faculty and learner

## G2-12-008-002  [P2] GAP  facet F01  effort S
- Legacy: Heading from ContentTitle `YouTube Video` and ContentAddedDate `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:169-170`
- vNext now: Content wrapper generic type/lesson header and learner progress `src/components/courses/learner-course-workspace.tsx:154-181,273-291`
- Fix: Match exact legacy content header/title/date placement

## G2-15-008-001  [P2] GAP  facet F01  effort M
- Legacy: Old syllabus detail is inline `SyllabusDetail` with `backToSyllabus`, previous/next lesson callbacks, focusContentId (syllabusDetail.js:78-89,265-281)
- vNext now: VNext `/learn/courses/[deliveryId]/roadmap?lesson=&content=` renders Learning Path with selectable lessons and content dialog (courseTab/page.tsx:125-135; learner-course-workspace.tsx:601-624)
- Fix: Maintain prior/next lesson arrows and Back to syllabus in selected detail view; preserve focus deep links

## G2-15-008-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy top+bottom Back, Previous lesson, Next lesson navigation (syllabusDetail.js:265-281,412-427)
- vNext now: VNext course navbar Back to courses/Tabs, lesson selection only via roadmap outline (courseTab/page.tsx:162-197; learner-course-workspace.tsx:601-624,691-710)
- Fix: Add exact lesson navigation links above and below selected content list

## G2-15-008-004  [P2] GAP  facet F02  effort L
- Legacy: Old lesson nav then lesson head/title, progress bar, count/type tags, Add content for faculty, item list, bottom nav, drawer (syllabusDetail.js:263-439)
- vNext now: VNext global course header+Tabs+Course options, Roadmap title+overall course progress+lesson accordion/items/dialog (courseTab/page.tsx:162-197; learner-course-workspace.tsx:691-760)
- Fix: Restore inline selected lesson detail hierarchy inside Learning Path; distinguish overall course progress from per-lesson

## G2-15-008-055  [P2] GAP  facet F17  effort M
- Legacy: Legacy auto-scroll focusContentId 300ms, scrollIntoView center (syllabusDetail.js:233-240)
- vNext now: VNext focus query opens highlighted dialog and ring using initiallyOpen/highlighted (learner-roadmap-item-dialog.tsx:9-36; learner-course-workspace.tsx:601-624)
- Fix: Provide legacy in-page anchor focus/scroll without unexpected modal, restore focus on Back

## G2-15-008-058  [P2] GAP  facet F19  effort L
- Legacy: Legacy content+quiz requests concurrently Promise.all, progress/submitted separate requests (syllabusDetail.js:444-482,119-137,494-515)
- vNext now: VNext one broad learner workspace read includes all lessons/items/progress before page render (courseTab/page.tsx:58-66; learner-course-workspace.tsx:616-669)
- Fix: Avoid full-course expensive reads for selected lesson deep link; cache/stale-while-revalidate scoped items

## G2-16-008-002  [P2] GAP  facet F01  effort M
- Legacy: `syllabus.js:874-880`: nested in legacy learn-projects-detail/learn-syllabus-list wrapper within course tab layout.
- vNext now: `src/components/courses/learner-course-workspace.tsx:691-715`: generic space-y layout and screen-reader-only Learning Path title.
- Fix: Clone original page head and canvas gutters, not content body only.

## G2-16-008-004  [P2] GAP  facet F02  effort M
- Legacy: `syllabus.js:874-953`: legacy top wraps status alerts, filters, lesson cards; no progress hero before list.
- vNext now: `learner-course-workspace.tsx:709-785`: adds large roadmap hero, progress bar, breakdown disclosure before filters.
- Fix: Restore legacy direct-filter-first hierarchy; keep metrics as secondary collapsed region if approved.

## G2-16-008-005  [P2] GAP  facet F02  effort M
- Legacy: `syllabus.js:935-952`: filter chip row immediately preceding roadmap list.
- vNext now: `learner-course-workspace.tsx:775-811`: Tabs counts then mobile Jump-to-lesson and EmptyState.
- Fix: Style five filters as compact chips and position immediately above cards.

## G2-16-008-006  [P2] GAP  facet F02  effort M
- Legacy: `syllabus.js:981-1011`: bordered lesson cards with two-digit index, title, status/count right and chevron.
- vNext now: `learner-course-workspace.tsx:838-891`: border-b Disclosure with index/title, paragraph description, right status/count and chevron.
- Fix: Restore legacy card boundaries, padding, counter placement, active row styling.

## G2-16-008-007  [P2] GAP  facet F03  effort S
- Legacy: `syllabus.js:90-96,938-949`: five controls All/Lectures/Resources/Assessments/Live sessions, aria-pressed.
- vNext now: `learner-course-workspace.tsx:624-630,775-785`: exact five labels, but tab links with count badges.
- Fix: Use pill buttons aria-pressed and no numeric count on filter control if strict parity.

## G2-16-008-009  [P2] GAP  facet F03  effort M
- Legacy: `syllabus.js:1071-1110`: content row clickable button with icon, text, due/status and keyboard.
- vNext now: `learner-course-workspace.tsx:925-977`: LearnerRoadmapItemDialog wrapper, detail expands in overlay.
- Fix: Recreate icon/tone/status density in list row and immediate content viewer dispatch.

## G2-16-008-012  [P2] GAP  facet F04  effort M
- Legacy: `syllabus.js:38-46`: six content types Resource, video, YouTube, Assignment, Quiz, Live session and respective icons.
- vNext now: `learner-course-workspace.tsx:121-131,168-170,373-376`: CONTENT kind collapsed to `Learning content`, raw uppercase content type badges.
- Fix: Render legacy content labels and type-specific icons including YouTube distinct.

## G2-16-008-013  [P2] GAP  facet F04  effort S
- Legacy: `syllabus.js:1085-1089`: subtitle `Lecture · Due ...` and live schedule in one small line.
- vNext now: `learner-course-workspace.tsx:197-235`: title then badges/schedule in expanded ContentCard.
- Fix: Place type and due-time metadata on collapsed row as legacy.

## G2-16-008-015  [P2] GAP  facet F04  effort S
- Legacy: `syllabus.js:1062-1064`: watched percentage rounded and shown for video/youtube in list.
- vNext now: `learner-course-workspace.tsx:180-186`: percent watched only inside expanded content card.
- Fix: Surface watched percentage on overview content row.

## G2-16-008-016  [P2] GAP  facet F04  effort M
- Legacy: `syllabus.js:1101-1108`: statuses `Live now`, `Ended`, `Not submitted`, `Missed`, `Locked`, `Unavailable · deadline missing`.
- vNext now: `learner-course-workspace.tsx:158-196,363-395`: statuses scheduled/ended, overdue and completed inside item cards.
- Fix: Show exact list-row status labels from computed interaction state.

## G2-16-008-018  [P2] GAP  facet F05  effort S
- Legacy: `syllabus.js:829-860`: learner filters lesson groups with zero visible eligible child items out.
- vNext now: `learner-course-workspace.tsx:811-815`: renders all workspace lessons even when zero eligible in selected filter.
- Fix: Match legacy omission of empty learner lesson groups, or intentionally preserve empty state and document.

## G2-16-008-023  [P2] GAP  facet F06  effort M
- Legacy: `syllabus.js:615-627`: expanded lesson Set remembers which rows expanded within mount.
- vNext now: `learner-course-workspace.tsx:838-845`: each Disclosure defaultOpen on focus/current lesson, reset on navigation.
- Fix: Preserve multiple simultaneously expanded groups and expansion across filter switch.

## G2-16-008-024  [P2] GAP  facet F06  effort S
- Legacy: `syllabus.js:649-677`: initial expansion first eligible learner lesson (regardless of current completion).
- vNext now: `learner-course-workspace.tsx:840-844`: first `nextItem` lesson, else first lesson.
- Fix: Match initial first eligible expansion when no deep link; do not automatically jump to later unfinished lesson.

## G2-16-008-025  [P2] GAP  facet F06  effort M
- Legacy: `syllabus.js:769-827`: ?lesson & content open same selected content once per unique key, suppress after close.
- vNext now: `page.tsx:125-135`; `learner-course-workspace.tsx:930-943`: focus item via URL, keyed dialog open.
- Fix: Avoid re-opening after route refresh, preserve once-per-URL focus state.

## G2-16-008-026  [P2] GAP  facet F06  effort M
- Legacy: `syllabus.js:528-578`: clicking content dispatches modal/assignment/quiz path.
- vNext now: `learner-course-workspace.tsx:925-977`: opens typed LearnerRoadmapItemDialog for all item kinds.
- Fix: Preserve type-specific viewer dispatch and read-only quiz review paths.

## G2-16-008-034  [P2] GAP  facet F09  effort L
- Legacy: `syllabus.js:314-376`: roadmap viewer type-specific Video/Youtube/Resource/Live/Quiz; quiz iframe sandbox and min-height.
- vNext now: `learner-course-workspace.tsx:930-944,253-340`: typed dialog content with native player, links and assignment controls.
- Fix: Match modal geometry, active viewer type and quiz review interaction; keep safer sandbox if retained.

## G2-16-008-035  [P2] GAP  facet F09  effort M
- Legacy: `syllabus.js:341-342`: assignment opened in ViewAssignmentModal separate from roadmap Modal.
- vNext now: `learner-course-workspace.tsx:951-977`: assignment dialog uses generic LearnerRoadmapItemDialog.
- Fix: Restore dedicated assignment drawer/modal layout and submission actions parity.

## G2-16-008-037  [P2] GAP  facet F09  effort M
- Legacy: `syllabus.js:600-613`: iframe quiz close uses same-origin postMessage `closeRoadmapQuiz`.
- vNext now: `learner-course-workspace.tsx:930-977`: no iframe postMessage listener; quiz native QuizAttemptControl.
- Fix: Ensure equivalent return-to-roadmap and completion refresh from native quiz without postMessage.

## G2-16-008-041  [P2] GAP  facet F11  effort M
- Legacy: `syllabus.js:544-563,656-657`: learnerChildAvailability hides unpublished, blocks locked; status/eligibility.
- vNext now: `learner-course-service.ts:925-965`; `learner-course-workspace.tsx:157-196`: DB filters published and scheduled labels.
- Fix: Verify lesson publication and locked content are not leaking in vNext per tenant/delivery.

## G2-16-008-043  [P2] GAP  facet F12  effort M
- Legacy: `syllabus.js:249-256,1053-1078`: expired unsubmitted quiz shows Missed/reviewOnly, missing deadline disabled.
- vNext now: `learner-course-service.ts:1034-1073`; `learner-course-workspace.tsx:581-596`: CLOSED/MISSED read-only attempts, no item-row missing deadline badge.
- Fix: Expose disabled quiz missing-deadline status on list and read-only review state, not attempts.

## G2-16-008-045  [P2] GAP  facet F12  effort S
- Legacy: `syllabus.js:973-980`: lesson done only when all items completed, no faux current if done.
- vNext now: `learner-course-workspace.tsx:817-880`: computed lessonProgressState and current lesson based on nextItem.
- Fix: Verify current and finished state definitions against legacy first-incomplete content.

## G2-16-008-046  [P2] GAP  facet F12  effort M
- Legacy: `syllabus.js:1054-1069`: locked content disabled, title carries reason; unavailable deadline flag.
- vNext now: `learner-course-workspace.tsx:926-944`: dialog existence based on server returned published items; availability badge in card.
- Fix: Disable opening locked/unavailable content in list and show reason without requiring opening.

## G2-16-008-047  [P2] GAP  facet F13  effort M
- Legacy: `syllabus.js:895-915`: specific lesson error, not assigned, and empty no roadmap items.
- vNext now: `learner-course-workspace.tsx:682-689,809-810`: no roadmap empty state, missing enrollment through notFound.
- Fix: Restore context-aware not-assigned and retry states; empty exact title already matches.

## G2-16-008-051  [P2] GAP  facet F14  effort M
- Legacy: `syllabus.js:351-368`: quiz opens sandboxed iframe via `/quiz?quizId=...&embed=roadmap`.
- vNext now: `learner-course-workspace.tsx:582-590`: direct attempt control without iframe.
- Fix: Verify full attempt flow and read-only review parity; iframe itself can be intentionally replaced.

## G2-16-008-054  [P2] GAP  facet F16  effort M
- Legacy: `syllabus.js:937-1011`: filter buttons horizontal wrapping and lesson cards flexible.
- vNext now: `learner-course-workspace.tsx:775-811,838-889`: Tabs with counts and mobile Jump to lesson; different breakpoints.
- Fix: Match chip wrap/card spacing at 1280/768/375, preserve optional mobile navigator only as supplement.

## G2-16-008-056  [P2] GAP  facet F17  effort S
- Legacy: `syllabus.js:937-949`: filters labelled role=group, button aria-pressed.
- vNext now: `learner-course-workspace.tsx:775-785`: Tabs ariaLabel, links with count; semantically Tab instead of filter button.
- Fix: Use correct pressed filter semantics or prove accessible Tab behavior with active link.

## G2-16-008-057  [P2] GAP  facet F17  effort S
- Legacy: `syllabus.js:983-1011`: lesson button aria-expanded, aria-controls named region and aria-current step.
- vNext now: `learner-course-workspace.tsx:838-889`: Disclosure native summary; no aria-current step on active lesson.
- Fix: Restore aria-current=step for next lesson, proper aria-describedby count.

## G2-16-008-058  [P2] GAP  facet F17  effort S
- Legacy: `syllabus.js:1071-1079`: content row aria-label includes view type + completed/locked/expired status.
- vNext now: `learner-course-workspace.tsx:931-943`: dialogue trigger generally title/progress, missing explicit status in accessible name.
- Fix: Give content trigger equivalent contextual aria label.

## G2-16-008-067  [P2] GAP  facet F21  effort M
- Legacy: `syllabus.js:4-7`: Spring lesson/quiz APIs and external media viewers.
- vNext now: `learner-course-service.ts:804-1075`; `learner-course-workspace.tsx:253-322`: Drizzle aggregate plus signed media and external providers.
- Fix: Verify video/YouTube playback availability and external URL safety against approved original.

## G2-16-008-068  [P2] GAP  facet F21  effort M
- Legacy: `syllabus.js:600-613`: iframe quiz module isolated with same-origin close message.
- vNext now: `learner-course-workspace.tsx:582-590`: native quiz attempt controls.
- Fix: Ensure embedding replacement works without popup navigation/trapped back gesture.

## G2-16-008-072  [P2] GAP  facet F23  effort L
- Legacy: `syllabus.js:874-1144`: learner filtered lesson card list and per-type content modal.
- vNext now: `learner-course-workspace.tsx:691-977`: new hero/progress, disclosures, richer breakdown, generic dialogs.
- Fix: Clone legacy list/canvas before altering per-item content presentation.

## G2-17-008-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:53-66 — Legacy syllabus embeds resource viewer; faculty vs learner checked with login user.
- vNext now: src/components/courses/learner-course-workspace.tsx:134-164 — Learner delivery workspace uses ContentCard, no matching standalone route.
- Fix: Preserve anchored access/modal detail within delivery workspace.

## G2-17-008-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:115-129 — inModal toggles title duplication and shows badge/scope/date only.
- vNext now: src/components/courses/learner-course-workspace.tsx:165-203 — Always shows type, progress and sequence plus title.
- Fix: Add viewer modal flag with legacy condensed header.
