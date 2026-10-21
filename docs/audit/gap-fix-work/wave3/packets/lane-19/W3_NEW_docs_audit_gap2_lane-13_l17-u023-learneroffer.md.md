# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-13/l17-u023-learneroffer.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l17-u023-learneroffer.md

## G2-17-23-050  [P1] MISSING  facet F10 Interview cancellations  effort L
- Legacy: JS:1232 decline and JS:1409–1413 cascade cancel active interviews; JS:1423+ describes deferred interview-specific notifications
- vNext now: VS:735–1013 updates offer and sibling applications but no direct interview-cancellation call in reviewed response method
- Fix: Trace vNext round/candidate-slot management on decline/withdraw, cancel only affected future interviews, persist audit and notify participants after commit
