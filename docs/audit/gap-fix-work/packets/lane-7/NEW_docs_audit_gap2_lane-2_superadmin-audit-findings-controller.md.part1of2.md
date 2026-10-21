# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/superadmin-audit-findings-controller.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/superadmin-audit-findings-controller.md

## G2-2-001-001  [P1] GAP  facet F01  effort M
- Legacy: LF:194-221 /tracker/audit-findings in TrackerShell; password-door fallback
- vNext now: NP:24-33 superadmin route, redirects to /dashboard
- Fix: Decide whether tracker password door must remain; implement equivalent verified gate without weakening server permission.

## G2-2-001-005  [P1] MISSING  facet F03  effort M
- Legacy: LF:117 Sync now with rotating SyncOutlined and loading
- vNext now: NP:24-135 no manual sync button
- Fix: Add guarded POST sync route/button with loading; surface run outcome.

## G2-2-001-013  [P1] MISSING  facet F04  effort M
- Legacy: LD:130-145 Where, Affects/roles, Seen on/environment, Reported agent/session, duplicate and short commit chips
- vNext now: ND:47-53 path/page/endpoint, 74-78 commits; no role/environment/session view
- Fix: Surface omitted provenance, roles, environment, duplicate, reported agent session.

## G2-2-001-015  [P1] GAP  facet F05  effort S
- Legacy: LS:65-68 severity priority critical,high,medium,low, then found_at DESC,id
- vNext now: NS:52-54 foundAt DESC, importedAt DESC,id
- Fix: Restore severity-first server sort and deterministic reported-date tie-break.

## G2-2-001-018  [P1] GAP  facet F05  effort M
- Legacy: LS:51-58 backend comma-separated multi-value filters and search title/summary/id/where_json
- vNext now: NM:16-21 repeated params; NS:24-38 search title,summary,externalId,sourcePath,paths; area partial text
- Fix: Match legacy exact area membership and multi-area OR semantics; search full Where JSON including pages/endpoints.

## G2-2-001-021  [P1] GAP  facet F06  effort S
- Legacy: LD:220-224 Assigned to, maxLength=100, placeholder Name or agent, disabled unless changed
- vNext now: NA:75-77 Assignee maxLength=150, empty placeholder, generic save
- Fix: Cap assignee at 100 and restore placeholder/unchanged-disabled state.

## G2-2-001-022  [P1] GAP  facet F06  effort M
- Legacy: LD:229-234 fixed repo select lms,lms2-fe,both,infra,other and SHA 7-40 lowercase
- vNext now: NA:22 default 42Students/lms-vnext, 87-90 free repo input; NV:13 requires 42Students/name
- Fix: Map legacy repo whitelist to accepted repository values and set legacy default lms2-fe; validate sha format.

## G2-2-001-023  [P1] GAP  facet F06  effort S
- Legacy: LD:237-240 Comment textarea 2 rows, maxLength 4000, placeholder Add to the history
- vNext now: NA:92-94 Note or reason 3 rows, maxLength 1000
- Fix: Use 4000-comment limit and preserve distinct comment input/placeholder.

## G2-2-001-024  [P1] GAP  facet F06  effort M
- Legacy: LD:166-177 duplicate picker suggests server similarity candidates; LD:183-191 optional id free-entry
- vNext now: NA:78-85 UUID datalist and placeholder Select a matching finding
- Fix: Accept finding external IDs and server-provided similarity suggestions, not DB UUIDs.

## G2-2-001-025  [P1] GAP  facet F07  effort M
- Legacy: LS:134-147 exact errors Unknown status, It is already..., Say why..., Only a fixed finding..., Choose the finding this repeats
- vNext now: NT:7-22 stricter state machine; NE:13-19 generic invalid transition/error
- Fix: Match permitted transitions or log intentional stricter redesign; map exact legacy error messages.

## G2-2-001-027  [P1] GAP  facet F07  effort S
- Legacy: LS:167-168 Keep the name under 100 characters
- vNext now: NV:11 max 150 and min 2; NA:76 maxLength 150
- Fix: Restore max 100, allow 1-character assignee, exact error.

## G2-2-001-028  [P1] GAP  facet F07  effort S
- Legacy: LS:176-179 Write a comment on blank
- vNext now: NV:4,14 min 4, max 1000; NA:41-43 at least four
- Fix: Allow 1-4000 comment characters and return Write a comment for whitespace-only.

## G2-2-001-038  [P1] GAP  facet F10  effort M
- Legacy: LS:133-193 every mutation emits event with actor/from/to/note and detail response
- vNext now: NS:90-119 event logs only action,note,fromStatus,toStatus,user id
- Fix: Persist assignee/severity/commit old/new values and commit JSON for lossless history.

## G2-2-001-040  [P1] GAP  facet F11  effort M
- Legacy: LC:100-107 actor() super-admin only, impersonation actor label; noStore for all endpoints
- vNext now: NS:15-19 superadmin+no acting scope+admin-scope.select; NE:9 origin guard
- Fix: Document/approve stricter acting-scope restriction and actor identity; keep no-store on all sensitive responses.

## G2-2-001-041  [P1] GAP  facet F11  effort M
- Legacy: LF:194-221 legacy password door on missing manager hint, refresh token then clear session
- vNext now: NP:27-30 redirect any ineligible user to /dashboard
- Fix: Implement approved equivalent or document removal with owner authorization; verify denied-state UX.

## G2-2-001-043  [P1] GAP  facet F12  effort M
- Legacy: LS:139-140 released OR verified allowed from fixed/released
- vNext now: NT:14-16 released only FIXED_DEV; verified only RELEASED_PROD; FIXED_DEV only in_progress/confirmed
- Fix: Align transition graph to legacy (including new-to-fixed and fixed-to-verified) or record intentional gate.

## G2-2-001-044  [P1] GAP  facet F12  effort M
- Legacy: LS:142-150 duplicate status with external finding id; allows existing non-self
- vNext now: NS:98-103 dedicated DUPLICATE UUID, rejects targets already duplicate
- Fix: Resolve duplicate by external ID and match legacy target rules, or document strengthened constraints.

## G2-2-001-048  [P1] GAP  facet F14  effort M
- Legacy: LI:138-169 audits files and rejection reason; 307-315 result,error,checkedAt and up to 200 problematic files
- vNext now: NS:136-153 shows bounded first 50 path/reason, no result/checkedAt
- Fix: Persist and display result (REJECTED/TAMPERED/DELETED), checkedAt, and old 200-row diagnostics.

## G2-2-001-061  [P1] MISSING  facet F19  effort M
- Legacy: LG:39,92-103 10s connect and 20s GET timeout; LG:73-74 refuses truncated GitHub tree
- vNext now: NS:133-154 no GitHub integration path
- Fix: Port bounded GitHub timeouts/pagination failure diagnostics.

## G2-2-001-066  [P1] MISSING  facet F21  effort M
- Legacy: LI:253-264 agent and importer event types/status provenance
- vNext now: NS:115-118 only six manual action kinds
- Fix: Add import, agent_update, file_changed/deleted event types with actorKind/source file.
