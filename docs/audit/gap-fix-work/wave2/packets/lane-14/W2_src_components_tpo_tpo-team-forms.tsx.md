# Work packet (wave 2): edit src/components/tpo/tpo-team-forms.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-3/l11-u016-tpo-messages.md

## G2-19-031-016  [P2] GAP  facet F03  effort L
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamComposer.jsx:169-182` — Team composer presents @ picker, # picker, Ask and Decision controls.
- vNext now: `src/components/tpo/tpo-team-forms.tsx:143-168` — Private textarea plus decision checkbox; ask is separate panel and no @/#.
- Fix: Place rich token pickers and Ask by composer.

## G2-19-031-057  [P2] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamComposer.jsx:149-158` — @/# suggestions are ARIA listbox popup.
- vNext now: `src/components/tpo/tpo-team-forms.tsx:143-168` — New plain reply has no such picker.
- Fix: Implement listbox, keyboard navigation and token insertion.

## G2-19-031-103  [P2] MISSING  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamComposer.jsx:135-151` — @/# listbox supports arrows/Enter/Tab/Escape.
- vNext now: `src/components/tpo/tpo-team-forms.tsx:143-168` — No mention suggestion picker.
- Fix: Implement keyboard listbox token insertion.

## G2-11-016-027  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:242-262`
- vNext now: `src/components/tpo/tpo-team-forms.tsx:76-99`
- Fix: Legacy new team thread About Drive/Company/Student/Topic, private checkbox, multi-member choice, first message; vNext private TPO member-to-member topic/firstMessage form.

## G2-11-016-030  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:237-263`
- vNext now: `src/components/tpo/tpo-team-forms.tsx:76-99`
- Fix: Legacy Team first message optional, Topic max200, company/drive/student target picker; vNext requires named recipient with topic, no target selector.

## G2-11-016-038  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:233-263`
- vNext now: `src/components/tpo/tpo-team-forms.tsx:76-100`
- Fix: Legacy New conversation Modal with radio About, search linkable object, group people, privacy checkbox; vNext inline Disclosure with simple person-to-person form.

## G2-11-016-043  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:218-231`
- vNext now: `src/components/tpo/tpo-team-forms.tsx:56-74`
- Fix: Legacy starting team conversation about drive/company/student creates shared contextual thread; vNext private member thread with idempotency key.

## G2-11-016-074  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamConversations.jsx:206-215`
- vNext now: `src/components/tpo/tpo-team-forms.tsx:56-74`
- Fix: Legacy teamLookup allows company/student/drive topic search; vNext private TeamThreadCreate doesn't call entity lookup.

## G2-19-031-110  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/tpo/team/TeamComposer.jsx:41-41` — Team placeholder Write to the team. @ to mention, # to link a drive, company or student.
- vNext now: `src/components/tpo/tpo-team-forms.tsx:147-154` — New Share a private team update.
- Fix: Restore contextual placeholder when token tools exist.
