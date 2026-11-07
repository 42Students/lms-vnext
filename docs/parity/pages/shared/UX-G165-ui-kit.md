# UX-G165 — Shared UI kit, part 3

**Scope:** Six registered interactive primitives: `src/components/ui/tabs.tsx`, `textarea.tsx`, `third-party-link.tsx`, `toast.tsx`, `tooltip.tsx`, and `use-confirm-flow.tsx`. Canonical state: `docs/tracker.json#uxReview.groups[UX-G165]`.

## User-facing review and repairs

- **Tabs:** Preserve arrow/Home/End semantics, roving focus, permission-disabled tabs, scroll cues and reduced-motion classes. Do not mount a keyboard-focusable *blank* tab panel when all tabs are disabled or the current value is no longer authorized. Existing valid panels remain labelled by their selected tab.
- **Textarea:** Verified required/invalid semantics, 44px targets, callers' maxLength/rows, resize, focus ring and visible disabled state. These controls already meet scoped acceptance and were not changed.
- **External link:** HTTPS-only, no credentials, no ambiguous/control characters. The labelled copy fallback now maintains a stable `aria-controls` relationship even when collapsed, long labels wrap instead of overflowing phone widths, and the fallback no longer falsely asserts that opening the link has already failed.
- **Toasts:** Verified persistent errors cannot be auto-evicted, informational notices remain capped, dismiss actions have accessible labels, top-layer modal portal and keyboard focus/visual viewport scroll remain intact. No change required.
- **Tooltip:** Verified keyboard Escape/outside-pointer dismissal, named summary trigger, pointer-specific behavior and <=40dvh mobile fallback. No change required.
- **Confirm flow:** An empty caller prompt now displays a meaningful fallback title; existing cancel/unmount promise resolution and double-action protection retained.

## Acceptance and invariants

- `tests/unit/ux-g165-shared-controls.test.tsx`: real server render of tabs, textarea, HTTPS link, popover and toast, plus confirm-flow contract; exercises positive and invalid paths.
- Existing UI-kit unit suite `tests/unit/UX-kit-projects-hardening-chat17.test.tsx` included.
- Companion workflow `.github/workflows/ux-g165-g168-acceptance.yml`: scoped ESLint, full TypeScript, Vitest and real-browser smoke across 390px and 1280px in disposable seeded test database. Record exact-SHA results below.
- Existing accessibility and role/tenant authorization boundaries remain; these primitives must never act as permission checks. No newly introduced public routes or unauthorized content exposure.

**Closure boundary:** scoped UX and behavior, not global release certification. Completion receipt appended after successful execution.
