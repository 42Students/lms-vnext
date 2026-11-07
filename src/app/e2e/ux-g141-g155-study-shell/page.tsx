import { notFound } from "next/navigation";
import { CollegeGroupActions } from "@/components/groups/college-group-actions";
import { CollegeGroupImportPreview } from "@/components/groups/college-group-import-preview";
import { CollegeStudyMemberActions } from "@/components/groups/college-study-member-actions";
import { LearnerNotificationBell } from "@/components/shell/learner-notification-bell";
import { MobileNavigation } from "@/components/shell/mobile-navigation";
import { RouteAnnouncer } from "@/components/shell/route-announcer";

export const dynamic = "force-dynamic";

/** Synthetic interaction fixture, never enabled in production. */
export default function UXG141G155StudyShellFixture() {
  if (process.env.NODE_ENV !== "development" ||
      process.env["UX_STUDY_SHELL_FIXTURE"] !== "1") notFound();

  const groupId = "10000000-0000-4000-8000-000000000001";
  return <main id="lms-main-content" tabIndex={-1}
    className="mx-auto w-full max-w-4xl min-w-0 space-y-8 px-4 py-8">
    <h1 className="text-xl font-semibold">Study group and shell UX acceptance</h1>
    <section aria-label="Group creation fixture" className="space-y-2 border-b border-border pb-5">
      <h2 className="text-lg font-semibold">Group creation</h2>
      <CollegeGroupActions />
    </section>
    <section aria-label="Group management fixture" className="space-y-2 border-b border-border pb-5">
      <h2 className="text-lg font-semibold">Group management</h2>
      <CollegeGroupActions group={{
        id: groupId, name: "Study Group Alpha", kind: "STUDY_GROUP", status: "ACTIVE",
        description: "Example study group", capacity: 30, activeCount: 2, version: 1,
      }} />
    </section>
    <section aria-label="Member actions fixture" className="space-y-2 border-b border-border pb-5">
      <h2 className="text-lg font-semibold">Member actions</h2>
      <CollegeStudyMemberActions groupId={groupId} name="Study Group Alpha"
        members={[{
          membershipId: "20000000-0000-4000-8000-000000000001",
          displayName: "Example learner", state: "ACTIVE", isLocked: false, version: 1,
        }]}
        available={[{ id: "20000000-0000-4000-8000-000000000002", label: "Second example learner" }]} />
    </section>
    <section aria-label="Group import fixture" className="space-y-2 border-b border-border pb-5">
      <h2 className="text-lg font-semibold">Group CSV import</h2>
      <CollegeGroupImportPreview groupId={groupId} />
    </section>
    <section aria-label="Shell fixture" className="flex items-center gap-3 border-b border-border pb-5">
      <h2 className="text-lg font-semibold">Shell controls</h2>
      <MobileNavigation items={[
        { href: "/dashboard", label: "Overview", shortLabel: "O" },
        { href: "/learn/courses", label: "Courses", shortLabel: "C" },
      ]} />
      <LearnerNotificationBell />
    </section>
    <RouteAnnouncer />
  </main>;
}
