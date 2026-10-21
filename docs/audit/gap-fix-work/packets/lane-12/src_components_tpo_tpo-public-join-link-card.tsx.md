# Work packet: edit src/components/tpo/tpo-public-join-link-card.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u022-tpo-public-link.md, docs/audit/gap2/lane-11/tpo-companies.md

## G2-16-022-004  [P1] MISSING  facet F03  effort M
- Legacy: TpoPublicLinkController.java:39-51 GET,new/save toggles.
- vNext now: tpo-public-join-link-card.tsx:165-180 create/replace/on checkbox, no postDirect.
- Fix: Add Post directly toggle.

## G2-16-022-025  [P1] GAP  facet F14  effort M
- Legacy: CollegePublicLinkService.java:67-80 existing token re-shown.
- vNext now: tpo-public-join-link-card.tsx:121-127 clipboard freshUrl only.
- Fix: Restore safe reuse or explicit new-link recovery.

## G2-11-007-048  [P2] GAP  facet F08  effort S
- Legacy: Legacy trust success toast: `Trusted: their drive requests go live without review` or `Their drive requests come to you for review`. `docs/legacy-source/frontend/src/components/tpo/company/CompanyLinkCard.jsx:45`
- vNext now: vNext lifecycle/trust feedback surfaced in dedicated control; link card only `Link setting saved` for link switch. `src/components/tpo/tpo-public-join-link-card.tsx:127`
- Fix: Port exact trust-specific success toast to canonical toggle.

## G2-11-007-045  [P3] GAP  facet F07  effort S
- Legacy: Legacy domain API errors show server message or `Couldn't add the domain`. `docs/legacy-source/frontend/src/components/tpo/company/CompanyLinkCard.jsx:35`
- vNext now: vNext maps DOMAIN_IN_USE/ALREADY_SET else generic `Couldn't add domain`. `src/components/tpo/tpo-public-join-link-card.tsx:95`
- Fix: Match punctuation and specific validation copy, retain actionable conflicts.

## G2-11-007-046  [P3] GAP  facet F07  effort S
- Legacy: Legacy new link error `Couldn't make the link`, with server reason passed through. `docs/legacy-source/frontend/src/components/tpo/company/CompanyLinkCard.jsx:29`
- vNext now: vNext errors `Couldn't make the link. Check your access and try again.` or domain-specific text. `src/components/tpo/tpo-public-join-link-card.tsx:48`
- Fix: Keep exact fallback wording after privacy-safe error mapping.

## G2-11-007-049  [P3] GAP  facet F08  effort S
- Legacy: Legacy domain success toast `Domain added`. `docs/legacy-source/frontend/src/components/tpo/company/CompanyLinkCard.jsx:40`
- vNext now: vNext says `Email domain added`. `src/components/tpo/tpo-public-join-link-card.tsx:99`
- Fix: Use literal `Domain added` copy.

## G2-16-022-014  [P3] GAP  facet F07  effort S
- Legacy: CollegePublicLinkService.java:97-99 `Couldn't make the link`.
- vNext now: tpo-public-join-link-card.tsx:55-63 longer friendly fallback.
- Fix: Match exact legacy error copy if required.

## G2-16-022-015  [P3] GAP  facet F08  effort S
- Legacy: CollegePublicLinkService.java:119-120 audit new link/old revoked.
- vNext now: tpo-public-join-link-card.tsx:59-61 `New link made`.
- Fix: Show old link stopped working message.
