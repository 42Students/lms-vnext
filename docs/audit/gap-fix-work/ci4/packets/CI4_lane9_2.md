# CI fix packet (round 4): src/app/(authenticated)/tpo/messages/[threadId]/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/tpo/messages/[threadId]/page.tsx

- [tsc] line 42:34 error TS2339: Property 'participantName' does not exist on type '{ id: string; collegeId: string; recruiterUserId: string; jobId: string | null; lastMessageAt: Date | null; replyTokenHash: string | null; recruiterEmailedAt: Date | null; createdAt: Date; }'.
- [tsc] line 42:76 error TS2339: Property 'subject' does not exist on type '{ id: string; collegeId: string; recruiterUserId: string; jobId: string | null; lastMessageAt: Date | null; replyTokenHash: string | null; recruiterEmailedAt: Date | null; createdAt: Date; }'.
- [tsc] line 46:62 error TS2339: Property 'companyName' does not exist on type '{ id: string; collegeId: string; recruiterUserId: string; jobId: string | null; lastMessageAt: Date | null; replyTokenHash: string | null; recruiterEmailedAt: Date | null; createdAt: Date; }'.
- [tsc] line 46:114 error TS2339: Property 'subject' does not exist on type '{ id: string; collegeId: string; recruiterUserId: string; jobId: string | null; lastMessageAt: Date | null; replyTokenHash: string | null; recruiterEmailedAt: Date | null; createdAt: Date; }'.
- [tsc] line 49:16 error TS2339: Property 'accessEnded' does not exist on type '{ id: string; collegeId: string; recruiterUserId: string; jobId: string | null; lastMessageAt: Date | null; replyTokenHash: string | null; recruiterEmailedAt: Date | null; createdAt: Date; }'.
- [tsc] line 65:68 error TS2339: Property 'participantName' does not exist on type '{ id: string; collegeId: string; recruiterUserId: string; jobId: string | null; lastMessageAt: Date | null; replyTokenHash: string | null; recruiterEmailedAt: Date | null; createdAt: Date; }'.
- [tsc] line 80:30 error TS2339: Property 'accessEnded' does not exist on type '{ id: string; collegeId: string; recruiterUserId: string; jobId: string | null; lastMessageAt: Date | null; replyTokenHash: string | null; recruiterEmailedAt: Date | null; createdAt: Date; }'.
