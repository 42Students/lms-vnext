# Chat-9 shell dependencies — source verification

Tests were authored but not run by the builder; orchestrator confirms execution and browser behavior. DONE is source-level only.

| ID | Status | Evidence |
|---|---|---|
| GR-16 | DONE | `src/components/shell/shell-connectivity-notice.tsx`; `tests/unit/chat9-shell-tpo-graceful-topbar.test.ts` — `GR-16 PUB-auth-public-24 shows an offline notice and removes it on reconnect` |
| GR-70 | DONE | `src/components/shell/shell-widget-boundary.tsx; src/components/shell/app-shell.tsx`; `tests/unit/chat9-shell-tpo-graceful-topbar.test.ts` — `GR-70 uses separate retryable boundaries so failed widgets do not collapse other shell controls` |
| GR-75 | DONE | `src/components/shell/shell-counts-model.ts; src/components/shell/tpo-topbar-messages.tsx; src/components/shell/sidebar-nav.tsx`; `tests/unit/chat9-shell-unread-graceful.test.ts` — `GR-75 suppresses invalid realtime counters without leaking provider errors` |
