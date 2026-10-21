# Work packet (wave 2): edit src/components/tpo/tpo-new-followup-modal.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-036  [P2] GAP  facet F06  effort M
- Legacy: Legacy recruiter placeholder Type a name or company and autofocus (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:139-142`)
- vNext now: vNext uses select Choose a recruiter and no shared searchable input (`src/components/tpo/tpo-new-followup-modal.tsx:110-118`)
- Fix: Restore searchable Select and autofocus

## G2-5-012-052  [P2] GAP  facet F09  effort S
- Legacy: Legacy dirty follow-up draft asks Discard this follow-up draft? Keep editing (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:102-118`)
- vNext now: vNext modal title Discard this unfinished follow-up? (`src/components/tpo/tpo-new-followup-modal.tsx:133-139`)
- Fix: Restore exact discard prompt body and button copy

## G2-5-012-084  [P2] GAP  facet F17  effort S
- Legacy: Legacy search popup receives autofocus on recruiter selector (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:139-142`)
- vNext now: vNext select focus not set when dialog opens (`src/components/tpo/tpo-new-followup-modal.tsx:110-118`)
- Fix: Focus recruiter search and return to slot button on close

## G2-5-012-039  [P3] GAP  facet F06  effort S
- Legacy: Legacy optional Note textarea is two rows and no frontend maxLength (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:159-159`)
- vNext now: vNext optional Note textarea three rows with 500-char max (`src/components/tpo/tpo-new-followup-modal.tsx:124-127`)
- Fix: Match visible two rows; keep documented server 500 limit where required
