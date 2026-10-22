# CI fix packet (round 4): src/app/(authenticated)/teacher/notifications/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/teacher/notifications/page.tsx

- [tsc] line 70:42 error TS2339: Property 'items' does not exist on type '{ id: string; broadcastGroupId: string | null; legacyAnnouncementId: bigint | null; legacyReceiverValue: bigint | null; legacySenderId: bigint | null; legacySenderType: string | null; ... 27 more ...; updatedAt: Date; }[]'.
- [tsc] line 70:55 error TS7006: Parameter 'item' implicitly has an 'any' type.
- [tsc] line 96:68 error TS7006: Parameter 'item' implicitly has an 'any' type.
- [tsc] line 113:74 error TS2339: Property 'items' does not exist on type '{ id: string; broadcastGroupId: string | null; legacyAnnouncementId: bigint | null; legacyReceiverValue: bigint | null; legacySenderId: bigint | null; legacySenderType: string | null; ... 27 more ...; updatedAt: Date; }[]'.
- [tsc] line 114:64 error TS2339: Property 'items' does not exist on type '{ id: string; broadcastGroupId: string | null; legacyAnnouncementId: bigint | null; legacyReceiverValue: bigint | null; legacySenderId: bigint | null; legacySenderType: string | null; ... 27 more ...; updatedAt: Date; }[]'.
- [tsc] line 114:77 error TS7006: Parameter 'item' implicitly has an 'any' type.
- [tsc] line 115:70 error TS2339: Property 'items' does not exist on type '{ id: string; broadcastGroupId: string | null; legacyAnnouncementId: bigint | null; legacyReceiverValue: bigint | null; legacySenderId: bigint | null; legacySenderType: string | null; ... 27 more ...; updatedAt: Date; }[]'.
- [tsc] line 115:83 error TS7006: Parameter 'item' implicitly has an 'any' type.
- [tsc] line 116:64 error TS2339: Property 'items' does not exist on type '{ id: string; broadcastGroupId: string | null; legacyAnnouncementId: bigint | null; legacyReceiverValue: bigint | null; legacySenderId: bigint | null; legacySenderType: string | null; ... 27 more ...; updatedAt: Date; }[]'.
- [tsc] line 116:77 error TS7006: Parameter 'item' implicitly has an 'any' type.
- [tsc] line 123:48 error TS2339: Property 'available' does not exist on type '{ id: string; broadcastGroupId: string | null; legacyAnnouncementId: bigint | null; legacyReceiverValue: bigint | null; legacySenderId: bigint | null; legacySenderType: string | null; ... 27 more ...; updatedAt: Date; }[]'.
