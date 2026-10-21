# Work packet: NEW / MISSING items from docs/audit/gap2/lane-13/l18-u019-faculty-verification.md

16 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l18-u019-faculty-verification.md

## G2-18-019-002  [P1] GAP  facet F01 Scope  effort M
- Legacy: LV:10-16 entity targets faculty only; LS:109-122 looks up Faculty by phone
- vNext now: VS:19-29 one user-linked challenge independent of role, later college choice
- Fix: Validate faculty membership/tenant before session and correct faculty redirect; never allow membership confusion

## G2-18-019-006  [P1] GAP  facet F04 Faculty identity  effort M
- Legacy: LV:15-16 `faculty_id` int references faculty identity logically; LS:112-115 retrieves faculty by phone
- vNext now: VA:26-33 userId UUID, optional collegeId/membershipId, targetRole
- Fix: Document faculty_id → user/membership UUID identity crosswalk; do not load old faculty IDs as UUIDs

## G2-18-019-007  [P1] GAP  facet F04 Phone  effort M
- Legacy: LV:17-18 stores plaintext `phone_number`, LR:12-14 looks up by plaintext number
- vNext now: VA:34-35 stores HMAC contactFingerprint; users.phoneE164 looked up by VR:36-40
- Fix: Preserve phone normalization and account resolution; do not duplicate raw phone in auth-attempt rows

## G2-18-019-008  [P1] GAP  facet F04 OTP secret  effort S
- Legacy: LV:19-20 column `otp` plaintext; LS:115 stores code
- vNext now: VA:39-43 keyed MACs `sms_code_mac`/`email_code_mac`; VS:25-29 constant-time comparison
- Fix: Treat keyed MAC as required security improvement; explicitly mark raw OTP intentionally dropped, never restore plaintext storage

## G2-18-019-009  [P1] GAP  facet F04 Attempts  effort S
- Legacy: LV:21-22 `incorrect_attempts`, LS:117 initializes 1 but LS:148-168 never increments
- vNext now: VA:44 verificationAttempts defaults 0; VR:259-267 atomically increments
- Fix: Retain shared max-five attempt budget for all channels; record legacy field semantics and no migration needed for spent OTPs

## G2-18-019-010  [P1] GAP  facet F04 Block timestamp  effort M
- Legacy: LV:23-24 `blocked_till_ts` stored as String; no use in LR:12-14 filtering
- vNext now: VA:49 expiresAt timestamptz; VS:33-43 rate limits
- Fix: Do not clone arbitrary string lockout; provide exact temporary block/retry time in Faculty UI backed by durable send/verify budget

## G2-18-019-011  [P1] GAP  facet F04 Verify flag  effort M
- Legacy: LV:25-26 `verify_status` Boolean default false from LS:119
- vNext now: VA:50 verifiedAt nullable timestamptz; VR:273-330 atomically consumes challenge
- Fix: Define verifiedAt/usedAt audit relationship; old boolean must not authorize new session

## G2-18-019-012  [P1] GAP  facet F04 Expired flag  effort S
- Legacy: LV:29-30 `is_expired` int; LR:12-14 requires 0/null
- vNext now: VA:49 expiresAt timestamp with checks VA:87-90,118-121
- Fix: Enforce clock-based five-minute expiry, never accept stale row simply because integer expired flag was not toggled

## G2-18-019-014  [P1] GAP  facet F05 Latest active OTP lookup  effort M
- Legacy: LR:12-14 `ORDER BY updated_at DESC LIMIT 1` filtered by phone/is_deleted/is_expired only
- vNext now: VR:220-234 loads challenge by UUID id; VS:386-403 rejects used/expired/wrong-tenant
- Fix: Migrate caller to attemptId; clear old challenge on new start and ensure stale OTP cannot authenticate

## G2-18-019-017  [P1] GAP  facet F06 Verify input  effort M
- Legacy: LC:449-476 phoneNumber and otp query arguments, trims both
- vNext now: VS:466-489 consumes UUID attemptId and code; VF:250-263 verifies by POST payload
- Fix: Keep POST body and attemptId contract; don't add insecure GET verification endpoint

## G2-18-019-025  [P1] GAP  facet F10 Save side effects  effort M
- Legacy: LS:109-122 writes one raw OTP faculty_acct_verification row AFTER LC:443 SMS send
- vNext now: VS:292-382 stores MAC challenge and sends via provider; VR:154-218 controlled insert
- Fix: Check delivery failure cannot leave a usable challenge or imply success; document record retention and phone costs

## G2-18-019-031  [P1] GAP  facet F12 Bypass codes  effort S
- Legacy: LS:50-83 special, global and tenant fixed codes restricted to nonprod `TestOtpService`
- vNext now: VC:58-60 dev-only test code; VS:25-29 indicates dev only
- Fix: Do not port any special-phone/global code; preserve isolated dev-only QA identities, disallow prod test OTP

## G2-18-019-036  [P1] GAP  facet F15 SMS notification  effort M
- Legacy: LC:439-444 `smsService.sendOtp(phoneNumber, otp, LMS)` before save
- vNext now: VS:358-360 `deps.sms.sendOtp`, can fail OTP_DELIVERY_FAILED; email fallback VS:405-451
- Fix: Verify SMS provider template/recipient, delivery retries and fallback recipients align required login reliability

## G2-18-019-044  [P1] GAP  facet F21 SMS dependency  effort M
- Legacy: LC:443 sends through SmsService, LS:31-32 optional TestOtpService
- vNext now: VS:358-368 injects SMS/email providers and secure test config
- Fix: Verify Exotel/actual provider credentials/templates and observed failure paths without leaking OTPs; audit provider integration separately

## G2-18-019-046  [P1] GAP  facet F22 Table name/key  effort M
- Legacy: LV:10-16 `faculty_acct_verification` with BaseModel ID int LB:23-26
- vNext now: VA:22-33 `identity_auth_attempts` id UUID, user/college/member UUID, targetRole
- Fix: Document legacy row-to-user mapping; deliberate separate-table retirement means no 1:1 PK migration required for expired OTP rows

## G2-18-019-047  [P1] GAP  facet F22 OTP columns  effort M
- Legacy: LV:17-32 phone_number, otp, incorrect_attempts, blocked_till_ts, verify_status, is_expired, max_resend_attempts
- vNext now: VA:34-51 fingerprint, MAC/expiry channels, verify/resend attempts, used/verified timestamps; M56:1-19
- Fix: Maintain field-by-field disposition in schema ledger, protect raw OTP and phone, never expose hashed MAC via API
