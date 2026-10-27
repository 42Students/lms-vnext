## 2026-10-28 TPO keyboard chord / global search coexistence

The authenticated topbar forwards typing from focused search-result option buttons into the search input. The TPO layout also registers global unmodified `G`/`N` two-key navigation chords. Before this patch, the TPO handler excluded text inputs but did not exclude result buttons, popover listboxes, dialogs or other interactive targets, so typing `g` then `d` while using a focused search result could inadvertently navigate to Drives.

The chord handler now ignores already-prevented events and keyboard events targeting links, buttons, listbox options and dialog/drawer/popover surfaces; it clears any pending chord prefix when such an event occurs. The existing outside-interactive G/N shortcuts and `?` help remain intact. The test `tests/unit/tpo-keyboard-shortcut-overlay-guard.test.ts` records this interaction boundary. This is source hardening and regression coverage, not a claim that browser keyboard acceptance ran.

Functional verification still needed: opening TPO topbar with Ctrl/Cmd+K, arrowing into a suggestion, continuing text input including `gd`, pressing Enter, cancelling a dialog, and confirming `G+D` works only from ordinary unmodified page focus. Run on desktop and mobile keyboard; verify restricted TPO membership and inactive user contexts separately.
