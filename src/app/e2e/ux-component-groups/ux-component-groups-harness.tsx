"use client";

import { ActivityCenter, type ActivityCenterGroup } from "@/components/activity/activity-center";
import { LearnerNotificationsInbox } from "@/components/activity/learner-notifications-inbox";
import { OtherTenantSettings } from "@/components/admin/tenant-settings-other-keys";
import { CollegeSlotManager } from "@/components/electives/college-slot-manager";
import { ToastProvider } from "@/components/ui/toast";
import { Heading } from "@/components/ui/heading";

/** No provider calls, real identities, credentials, tenant data or auth shortcuts. */
const settings = Array.from({ length: 72 }, (_, i) => ({
  key: `demo.group.${String(i + 1).padStart(3, "0")}`,
  value: `Demonstration value ${i + 1}`,
  version: 1,
}));
const event: ActivityCenterGroup = {
  key: "fixture-activity",
  count: 2,
  latest: {
    event: {
      id: "11111111-1111-4111-8111-111111111111",
      module: "ACADEMICS",
      eventType: "COURSE_UPDATED",
      importance: "HIGH",
      subjectType: "COURSE",
      subjectId: "22222222-2222-4222-8222-222222222222",
      subjectLabel: "Synthetic UX course",
      summary: "A synthetic lesson was updated for the test fixture.",
      metadata: { change: "Demo only", organizationName: "Example organization" },
      occurredAt: "2026-11-07T08:00:00.000Z",
    },
    actor: { id: null, displayName: "Fixture staff", email: null },
  },
  earliest: { event: { occurredAt: "2026-11-07T07:00:00.000Z" } },
};

export function UxComponentGroupsHarness() {
  return <ToastProvider>
    <main className="mx-auto w-full max-w-5xl min-w-0 space-y-10 px-4 py-8 sm:px-6">
      <Heading level={1}>Synthetic UX component acceptance</Heading>
      <p className="text-sm text-body">These generated fixtures are disabled outside the development E2E environment.</p>
      <section aria-label="UX-G130 stored settings" className="min-w-0 space-y-3 border-b border-border pb-6">
        <Heading level={2}>Other stored settings</Heading>
        <OtherTenantSettings scopeType="COLLEGE" ready entries={settings} />
      </section>
      <section aria-label="UX-G140 elective slot" className="min-w-0 space-y-3 border-b border-border pb-6">
        <Heading level={2}>Elective slot editing</Heading>
        <CollegeSlotManager
          options={{
            programs: [{ id: "11111111-1111-4111-8111-111111111111", name: "B.Tech Demo", durationTerms: 8 }],
            periods: [{ id: "22222222-2222-4222-8222-222222222222", name: "Demo term" }],
          }}
          row={{
            id: "33333333-3333-4333-8333-333333333333",
            name: "Synthetic elective slot",
            description: "A safely simulated slot.",
            status: "ACTIVE",
            version: 2,
            credits: 3,
            minPick: 1,
            maxPick: 2,
            programId: "11111111-1111-4111-8111-111111111111",
            academicPeriodId: null,
            semesterNumber: 2,
            academicYear: "2026-27",
            hasEnrollmentHistory: false,
          }}
        />
        <div aria-label="Missing program fixture">
          <CollegeSlotManager options={{ programs: [], periods: [] }} />
        </div>
      </section>
      <section aria-label="UX-G126 activity" className="min-w-0 space-y-4 border-b border-border pb-6">
        <Heading level={2}>Activity feed</Heading>
        <ActivityCenter groups={[event]} nextHref={null} nextRemaining={0} />
        <Heading level={3}>Empty activity state</Heading>
        <ActivityCenter groups={[]} nextHref={null} nextRemaining={0} emptyActionHref="/activity?view=all" />
      </section>
      <section aria-label="UX-G126 learner inbox" className="min-w-0 space-y-4">
        <Heading level={2}>Learner notification search</Heading>
        <LearnerNotificationsInbox
          personal={[{
            id: "44444444-4444-4444-8444-444444444444",
            title: "Synthetic project update",
            body: "A sample task was reviewed.",
            actionHref: null,
            readAt: null,
            createdAt: "2026-11-07T08:00:00.000Z",
            module: "PROJECTS",
            importance: "NORMAL",
          }]}
          announcements={[]}
          announcementsEnabled
        />
      </section>
    </main>
  </ToastProvider>;
}
