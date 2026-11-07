# Unauthenticated API sweep on dev, 2026-11-08 (SEC-08, SEC-14, central wrapper)

Manual evidence, dev only (`https://vnext.development.42lms.com`, image 356deba9), no cookie, no credentials. Scripts: `scripts/verify/unauth-api-sweep-get.mjs` and `unauth-api-sweep-mutating.mjs` (`SWEEP_BASE=<dev origin>`; they refuse any host that is not a dev or localhost origin).

**GET, 533 routes** (dynamic segments filled with a zero UUID): 520 answered 401, 8 answered 404, 3 redirected (307), 1 answered 403 and exactly 1 answered 200: `/api/v1/public/tenant-bootstrap`, which is public by design and returns only the host mode and base domain.

**POST, PUT, PATCH, DELETE, 782 method and route pairs** (empty JSON body, same-origin header so the credential check is what is tested): 731 answered 401, 12 answered 403, 11 answered 404, 16 answered 400 (the public sign-in, join and send-code endpoints refusing an empty request), 5 answered 200 (logout in its three forms, and the token-based unsubscribe, which answers the same for any token so it does not reveal valid tokens), 4 answered 503 (features not configured on dev), 1 answered 303 (public unsubscribe form post). Two requests answered 502 once under six-way parallel load and answered normally on retry (pod had no restarts); treated as a transient gateway reset, not reproduced.

Conclusion: no data route answers an unauthenticated caller; every non-public route sits behind the wrapper's credential check. Not covered: authenticated roles against routes they should not reach (see `cross-college-api-probe-2026-11-08.md` for the college-admin attacker) and the public endpoints' abuse limits.
