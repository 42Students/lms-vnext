# Faculty filter/search submit buttons

Ten page-owned search/filter submit actions across `/teacher` now use shared `Button variant="primary" type="submit"`. Legacy action labels, GET method/query preservation, permission gates and destinations are unchanged. The shared control supplies minimum 44px height, semantic focus styling and reduced motion. Source tests: `UX-teacher-shared-submit-01..10` in `tests/unit/UX-teacher-shared-submit-buttons-round9.test.ts`. Runtime/CI evidence pending.
