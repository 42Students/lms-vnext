# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-13/l18-u019-faculty-verification.md

13 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l18-u019-faculty-verification.md

## G2-18-019-001  [P2] GAP  facet F01 Entry route  effort M
- Legacy: LC:422-445 `login(phoneNumber)`, LC:449-476 GET `verifyOTP(phoneNumber,otp)` for Faculty
- vNext now: VF:198-263 starts/verifies via `/api/auth/login/start`, `/api/auth/login/verify`
- Fix: Ensure faculty login entry and deep links resolve through shared sign-in, preserving Faculty portal destination after session issuance

## G2-18-019-004  [P2] GAP  facet F03 Visible confirmation  effort S
- Legacy: LC:443-445 returns `OTP triggered` on send
- vNext now: VF:223-236 shows `Your code is on its way.`
- Fix: Confirm desired end-user copy on Faculty path and preserve resend success without disclosing phone existence

## G2-18-019-013  [P2] GAP  facet F04 Resend  effort M
- Legacy: LV:31-32 `max_resend_attempts` int set 3 by LS:116
- vNext now: VA:45 resendAttempts count defaults 0; VS:41-43/405-451 email resend budget and cooldown
- Fix: Specify Faculty SMS/email resend allowance per session and enforce it consistently in UI/API; compare legacy 3 and new 5 cap

## G2-18-019-016  [P2] GAP  facet F06 Send input  effort S
- Legacy: LC:422-445 login with faculty phone (trimmed LS:110-112)
- vNext now: VS:207-215 normalized phone/email; VF:198-237 checks contact and starts challenge
- Fix: Preserve accepted Indian phone formats and tenant-aware faculty identity; make validation messages match intended sign-in UX

## G2-18-019-018  [P2] GAP  facet F06 Resend default  effort M
- Legacy: LS:116 maxResendAttempts 3 on insert, no shown enforcement in LS:109-168
- vNext now: VA:45 and VR:238-257 cap email resend, UI cooldown VF:532-542
- Fix: Document SMS/email channel policies, disable resend button until server allows; do not equate stale legacy counter with active enforcement

## G2-18-019-019  [P2] GAP  facet F07 Invalid faculty  effort S
- Legacy: LC:425-427 `No faculty registered with Mobile number ...`; LC:453-455 `No instructor registered with mobile number ...`
- vNext now: VF:53-76 normalized non-enumerating errors; VS:292-318 checks account
- Fix: Prefer privacy-safe unified account-not-found copy, document intentional nonenumeration vs exact legacy wording

## G2-18-019-020  [P2] GAP  facet F07 Missing code  effort S
- Legacy: LC:461-462 `OTP is required`, LC:473-474 `Incorrect OTP`
- vNext now: VF:65-70 `That code isn't right. Check it and try again.`; VS:75-77 maps to 401
- Fix: Preserve distinct required-vs-invalid feedback and error focus; avoid exposing OTP in API error logs

## G2-18-019-022  [P2] GAP  facet F08 Success  effort M
- Legacy: LC:443-445 send response `OTP triggered`; LC:476 successful verify returns faculty details
- vNext now: VS:545-576 grants user session after verifying auth; VF:250-279 navigates after verify
- Fix: Ensure session transitions to intended Faculty home and no successful sign-in bypasses membership checks

## G2-18-019-034  [P2] GAP  facet F13 Loading/offline  effort M
- Legacy: LV:9-33 no UI state, LC:422-476 synchronous HTTP
- vNext now: VF:198-306 tracks busy/send/verify, recovery; no direct entity loading
- Fix: Verify Faculty sign-in pending spinner/disabling duplicate submit and retry on SMS provider outage

## G2-18-019-039  [P2] GAP  facet F18 Exact wording  effort S
- Legacy: LC:445 `OTP triggered`; LC:462 `OTP is required`; LC:474 `Incorrect OTP`
- vNext now: VF:65-70 `That code isn't right. Check it and try again.` and friendly expired/retry copy
- Fix: Maintain explicit legacy↔new copy crosswalk, choose privacy-safe new copy and record intentional difference

## G2-18-019-040  [P2] GAP  facet F19 Volume/index  effort M
- Legacy: LR:12-14 SELECT latest by phone/updatedAt; index not shown in entity
- vNext now: VA:69-86 contact+timestamp, IP+timestamp, user+expiry indexes; M56:67-69, M58:2-3
- Fix: Inspect legacy snapshot for phone/updatedAt index; measure rate-bucket large-row scans after migration, keep index coverage

## G2-18-019-043  [P2] GAP  facet F20 Special characters/normalization  effort M
- Legacy: LS:109-112 trims string; LS:149-151 trims OTP and phone; repository matches exact phone
- vNext now: VS:207-215 normalizes E.164/email; VF:198-215 strips formatting
- Fix: Confirm +91/91/10-digit variants map to one account, no duplicate identity or bypass via alternate representation

## G2-18-019-048  [P2] GAP  facet F22 Timestamps/soft delete  effort M
- Legacy: LB:28-37 created_at/updated_at LocalDateTime, is_deleted Boolean default false
- vNext now: VA:47-51 createdAt/expiry/verified/used timestamptz; VT:16-20 physically purges
- Fix: Adopt UTC timestamps, explicit expiry and retention; do not translate legacy soft-delete flag as active challenge validity
