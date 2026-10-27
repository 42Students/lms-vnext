# CI unit recovery: recruiter/TPO parity (2026-10-28)

Source baseline: main@76f94d1d0baf631901009ac938ddae0314c584a6; GitHub Actions CI 40582068546 identified eight failing assertions across seven unit files. This batch repairs legacy UI semantics and accurately refreshes obsolete trust text assertions.

- TPO Batches CTA: replaced `text-on-primary` with white text on the primary background, consistent with the signed-off contrast source contract.
- Recruiter Calendar: restored **Agenda** as the default; Week and Month remain optional, and existing Monday-first selected weekly view remains available.
- Recruiter Drive: restored the ← All drives link, Rounds & interviews and offers-count labels, and six separate legacy tabs (Overview, Applicants, Rounds & interviews, Offers, Requests, Discussion). Change request controls render on Requests, while direct messaging remains within Discussion. The request navigation anchor now resolves on the correct tab, preserving scoped returnTo links and authorization.
- Company Trust: deliberately retained the stricter vNext implementation and updated two misleading tests. A college's Trusted flag does not itself grant recruiter verification, an active grant, or policy approval; outdated tests that claimed immediate auto-publication are false.
- Updated the recruiter tab source assertion to target the new Requests anchor.

All changes are source-level until GitHub Actions lint/unit/build and authorized browser/DB acceptance execute. No page or global tracker Green is claimed.
