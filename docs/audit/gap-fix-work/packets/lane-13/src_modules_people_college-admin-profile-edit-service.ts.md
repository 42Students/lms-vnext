# Work packet: edit src/modules/people/college-admin-profile-edit-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/college-admin-profile.md

## G2-1-026-074  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:95-130: gender,dob,bloodGroup; CT:130-228 contact mobile/phone/mail.
- vNext now: src/modules/people/college-admin-profile-edit-service.ts:15-33: no gender/DOB/bloodGroup; contacts only alternateEmail/alternatePhone/person.
- Fix: Create full column-to-key crosswalk and recover user data if migration planned.

## G2-1-026-075  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/profile/about/address.js:58-117: two addresses and city/state/pincode.
- vNext now: src/modules/people/college-admin-profile-edit-service.ts:24-27: line1/line2/city/state/postalCode/country; cannot represent two full addresses.
- Fix: Expand schema to support current/permanent; never silently merge.

## G2-1-026-035  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:905-913: names failed sections and retries each without clearing existing state.
- vNext now: src/modules/people/college-admin-profile-edit-service.ts:53-65: parses one profile JSON; invalid data falls back emptyProfile.
- Fix: Report malformed subsections instead of silently emptying.
