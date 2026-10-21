# Work packet: edit src/modules/placements/public-join/send-code-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/dns-mail-domain-resolver.md, docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md

## G2-13-012-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:22-34` Spring @Component called through MailDomainResolver.lookup by company-domain checks
- vNext now: `src/modules/placements/public-join/send-code-service.ts:75-91` inline resolveMx inside public invitation code API workflow; `src/modules/placements/tpo-company-domain-service.ts:18-26` company domain writer separate
- Fix: Extract shared DomainMailResolver service and call consistently from every relevant company-domain entry point

## G2-13-012-002  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-24` public recruiter/TPO/admin company-domain paths use one service; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:77-102` checkEmail/checkDomain
- vNext now: `src/modules/placements/public-join/send-code-service.ts:38-75` MX checks only public-code flow; `src/modules/placements/tpo-company-domain-service.ts:18-57` accepts validated domain without mail check
- Fix: Map every legacy checkEmail/checkDomain call site to vNext and apply equivalent requireMail policy

## G2-13-012-003  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:34-65` executes cache-check -> DNS MX/A/AAAA -> cache/return; no page sections
- vNext now: `src/modules/placements/public-join/send-code-service.ts:75-92` executes MX-only -> error or issue code; no UI layout inside resolver
- Fix: Retain order and lookup semantics at shared service; page layout N/A to service-only unit

## G2-13-012-006  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:34-43` returns Answer (NO_MAIL, ACCEPTS_MAIL, UNKNOWN), caches {answer, at}
- vNext now: `src/modules/placements/public-join/send-code-service.ts:77-91` returns exception paths, does not expose tri-state result; no cached metadata
- Fix: Introduce discriminated ACCEPTS_MAIL/NO_MAIL/UNKNOWN result and call-site policy

## G2-13-012-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:94-102` normalizes to registrable domain before resolver.lookup
- vNext now: `src/modules/placements/public-join/send-code-service.ts:76` gets host=email.split('@')[1] verbatim normalized-email host, not registrable domain
- Fix: Resolve canonical registrable domain for domain gate, or document domain-specific subdomain proof requirement

## G2-13-012-011  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:90-102` requireMail flag permits skipping DNS when false
- vNext now: `src/modules/placements/public-join/send-code-service.ts:75-91` public join always requires MX; `src/modules/placements/tpo-company-domain-service.ts:12-25` domain write never checks DNS
- Fix: Expose requireMail boolean per caller and document when true/false instead of inconsistent behavior

## G2-13-012-014  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:10-12` UNKNOWN means do not block on timeout/failure; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:101-102` only NO_MAIL blocks
- vNext now: `src/modules/placements/public-join/send-code-service.ts:88` EMAIL_MX_UNAVAILABLE fails/blocks code issuance
- Fix: Implement fail-open on DNS UNKNOWN for company validation if required; explicitly risk-assess OTP send before allowing proceed

## G2-13-012-016  [P1] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:76` timeout/communication exceptions rethrown then UNKNOWN
- vNext now: `src/modules/placements/public-join/send-code-service.ts:80-88` Promise.race timeout 3500ms rejects as EMAIL_MX_UNAVAILABLE
- Fix: Distinguish timed-out/temporary network failures from confirmed no-mail and return UNKNOWN

## G2-13-012-019  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:47-54` JNDI DnsContextFactory asks MX then A then AAAA serially and short-circuits
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-82` node:dns/promises resolveMx only
- Fix: Add RFC fallback A and AAAA queries when no MX, preserving error classification and short-circuiting

## G2-13-012-020  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:54` valid A-only or AAAA-only domain ACCEPTS_MAIL
- vNext now: `src/modules/placements/public-join/send-code-service.ts:90-91` empty MX records -> EMAIL_NO_MX
- Fix: Do not reject A-only/AAAA-only mail-receiving domains; test records and resolvers

## G2-13-012-026  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:7-12` allows MX or A/AAAA; no response is UNKNOWN not NO_MAIL
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-91` MX-only; unknown blocks join
- Fix: Restore documented semantics while retaining explicit safety decision for OTP mailability

## G2-13-012-029  [P1] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:58-59` DNS failure results UNKNOWN; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:101-102` caller accepts UNKNOWN
- vNext now: `src/modules/placements/public-join/error-copy.ts:3` shows 'We couldn't verify this email domain right now. Please try again.' and `src/modules/placements/public-join/send-code-service.ts:88` rejects
- Fix: Specify transient DNS UX and offer resilient retry without misreporting NO_MAIL

## G2-13-012-034  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:77-102` mail acceptability influences recruiter email acceptance
- vNext now: `src/modules/placements/public-join/send-code-service.ts:75-91` network failure can prevent a verification message (email never sent)
- Fix: Record notification suppression reason with caller, and offer retry only for transient DNS failures

## G2-13-012-045  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:69-77` treats non-timeout record-specific NamingException as absence, continues A/AAAA
- vNext now: `src/modules/placements/public-join/send-code-service.ts:83-88` ENODATA on MX immediately maps NO_MAIL
- Fix: On no MX data, query A and AAAA before declaring NO_MAIL

## G2-13-012-051  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:54` permits A or AAAA fallback and `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:58-59` UNKNOWN nonblocking
- vNext now: `src/modules/placements/public-join/send-code-service.ts:90-91` MX-only and `src/modules/placements/public-join/send-code-service.ts:88` temporary DNS failure blocks; no documented waiver
- Fix: Track intentional strict-mail policy as a migration decision, not a presumed match

## G2-12-012-004  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:5-15 returns ACCEPTS_MAIL, NO_MAIL, UNKNOWN
- vNext now: src/modules/placements/public-join/send-code-service.ts:19-24,83-91 uses EMAIL_NO_MX and EMAIL_MX_UNAVAILABLE exceptions
- Fix: Define shared tri-state domain outcome with explicit error mapping and documented callers

## G2-12-012-009  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:44-62 catches all other naming/runtime failures as UNKNOWN
- vNext now: src/modules/placements/public-join/send-code-service.ts:83-89 raises EMAIL_MX_UNAVAILABLE on DNS timeout/error
- Fix: Do not reject otherwise-valid company address for transient DNS failure; fail open or defer verification per product decision

## G2-12-012-012  [P1] GAP  facet F10  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:45-66 JNDI queries MX, falls back to A and AAAA
- vNext now: src/modules/placements/public-join/send-code-service.ts:77-91 queries MX only
- Fix: Check A and AAAA fallback after absent MX before NO_MAIL

## G2-12-012-014  [P1] GAP  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:56-61 defines common company-domain rules for recruiter signup, invites, TPO, Settings and Super Admin
- vNext now: src/modules/placements/tpo-company-domain-service.ts:18-24 requires active TPO; src/modules/placements/public-join/send-code-service.ts:38-53 separate anonymous rules
- Fix: Centralize domain policy across role-gated writes and anonymous verification without leaking domain lookups

## G2-12-012-017  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:10-15 UNKNOWN is neither acceptance proof nor definite NO_MAIL
- vNext now: src/modules/placements/public-join/send-code-service.ts:83-89 treats unknown as an error
- Fix: Preserve tri-state uncertainty semantics in all call sites
