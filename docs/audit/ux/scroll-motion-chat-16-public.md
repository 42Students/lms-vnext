# Chat-16 public route scroll and motion review

Reviewed all ten route pages assigned in `ux-coverage-closure.md`.

| Surface | Scroll container / cue | Motion |
|---|---|---|
| Company share result table | `DataTable` delegates horizontal overflow to shared `ScrollCue`, with labelled keyboard-reachable area and gradient cue | Global interactive tokens, no local timings |
| Company share watermark and forms | Watermark is visually clipped; no independently scrolling nested phone pane | No bespoke animation |
| Enterprises, Universities, Platform, Request demo | Normal document scroll; common marketing layout uses wrapping nav, min-width protection and full-size tap targets | Global interactive tokens |
| Forbidden | Static `GracefulScreen`; normal document scroll | Global tokens |
| Privacy policy | Redirect to existing standalone accessible HTML document; no React scroll pane | Separate standalone stylesheet, no local React motion |
| Legacy e2e sign-in | Redirect to normal sign-in entry, no custom scroll | Not applicable |
| College Admin departments and programs | Role-scoped redirects to canonical shared-kit pages, no custom scroll | Not applicable |

Tests: `UX-public-scroll-motion-02` and the route UX behavioral suites. No page introduces an invisible bespoke overflow region or a hard-coded 300ms+ transition. No nested scrolling was added. This is a source pass, not a mobile-browser or reduced-motion device run.
