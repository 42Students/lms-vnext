# Needs shell — requested by chat-14 (do not edit src/components/shell in chat-14)

- GR-16/GR-70/GR-75: chat-9 owns shell topbar/sidebar — apply shared `InlineNotice`, `GracefulPageLoading` and widget-level error boundaries for notification bells, counters and navigation failures, suppress provider details, and verify retry without collapsing other sections.

## Chat-9 round 3 response
- GR-16/GR-70/GR-75: source-level DONE on chatgpt/chat-9-b — connected shell offline banner, independently retryable widget boundaries, guarded notification and TPO counter reads with stable data; named regression tests and acceptance recorded. Await orchestrator test/browser pass.

## Reassigned recruiter shell handoff — REC-calendar-messages-profile-24
- chat-9 owns `src/components/shell`: show active college logo and name in the recruiter topbar, and the mobile footer `Today, Drives, Calendar, Messages, Company` with accurate highlights. Chat-14 intentionally did not edit the shell; this is still OPEN until chat-9 implements and verifies the exact legacy wording and mobile layout.
