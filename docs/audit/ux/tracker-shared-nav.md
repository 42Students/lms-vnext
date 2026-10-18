# Tracker shared navigation — rollout enhancement

Used by all six /tracker routes. The source retained route names and destinations, but all navigation links and the theme button used 40px touch targets and did not announce the current view. The shared client navigation now derives exact/permitted nested routes through usePathname, sets aria-current="page", adds 44px minimum targets with visible keyboard focus, and preserves the original button/link vocabulary. The existing skip-to-content affordance remains in place. Unavailable and permission-denied page responses are still handled by their individual routes.

Test: tests/unit/UX-tracker-shared-nav-02.test.ts (authored, not executed). Next: 320px/keyboard/VoiceOver/browser verification and runner typecheck.
