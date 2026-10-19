# North Star visual verification — chat-2

2026-10-19, verification after integrating latest `main` (`ee999dda2fc72340cfd7daaa4c46292c194a8c0c`). Target: `chatgpt/chat-2-b`.

## Source-of-truth contract

References: `docs/orchestrator/queues/master-queue.md` North Star; `docs/design/old-lms-shell.css`, `old-lms-shell-spec.md`, `old-lms-pages.md`; legacy SCSS in `docs/design/legacy-styles/`. Shared UI components now provide canonical 36px desktop controls, 9px control radii, 14px control text, 650 primary-button weight, and white-on-`#0a7c88`. `PageHeader` supplies the old LMS 30px/600/`#172033` desktop h1; `PageCanvas` is owned by the shell. This lane must not recreate those styles by wrapping a second page canvas.

## Verification findings and passes

1. **Critical:** compounded `rounded-[9px]-[9px]` classes observed in TPO campaign pages, apparently from repeated string replacement; malformed Tailwind selector receives no radius. Normalize any repeated / malformed button/input radius patterns.
2. **Duplicate shared controls:** `Input`/`Select`/`Button` now set height/radius/foreground directly; remove conflicting native utility overrides when possible and ensure legacy 36px desktop, mobile 44px touch targets remain accessible.
3. **Legacy style bypass:** inspect TPO route and component-level utility classes for hard-coded hex/RGB, direct spacing/card wrappers, dark-on-teal labels, non-token font/shadows and page-specific title overrides; keep intentional data status tones.
4. **Canvas:** remove layout-sized secondary page cards or redundant form cards, keep distinct status panels, chart/report tiles, dialogues and truly independent interactive objects.
5. **Second pass:** after chat-2 scope, audit chat-5 drive/job/offers/selection/waitlist TPO pages and chat-12 students/companies/recruiter roster pages, then public placements/recruiter join surfaces. Do not edit the shared kit, sidebar, topbar, or global CSS.

## Verification caveats

Source inspection only, no application execution, CI, tests or browser screenshots per owner. `main` may advance while lane work is in progress; keep branch changes scoped to `chatgpt/chat-2-b` and compare newest `main` before final status.
