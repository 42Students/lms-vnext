# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/recruiter-message-email-service.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/recruiter-message-email-service.md

## G2-20-010-047  [P2] GAP  facet F19  effort S
- Legacy: Batch 200 with independently caught errors `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:75-89`
- vNext now: Batch100 and serial transactions, each HTTP max 10 seconds [D:64-68,P:52]
- Fix: Set concurrency/timeout and throughput based on scheduler and backlog

## G2-20-010-051  [P2] GAP  facet F21  effort L
- Legacy: ZeptoMail template send plus Cloudflare inbound worker and Spring scheduling [M:20-24,172-190,I:22-33]
- vNext now: ZeptoMail outboundFetch and HMAC inbound gateway plus separate worker POST [P:24-55,R:18-26]
- Fix: Verify all provider configs, gateway, cron, DNS records and webhook signatures
