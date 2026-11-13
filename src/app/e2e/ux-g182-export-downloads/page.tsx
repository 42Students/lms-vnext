import { notFound } from "next/navigation";
import { exportClassTeamsCsv } from "@/modules/projects/class-team-csv-export";
import { learnerProjectActivityCsv } from "@/modules/projects/learner-project-activity-csv-model";
import { mentorActivityCsv } from "@/modules/projects/mentor-project-activity-export-model";
import { mentorCalendarCsv } from "@/modules/projects/mentor-calendar-export-model";
import { mentorPortfolioActivityCsv } from "@/modules/projects/mentor-portfolio-activity-export-model";
import { mentorReviewExportCsv } from "@/modules/projects/mentor-review-export-model";
import { mentorReviewedTasksCsv } from "@/modules/projects/mentor-task-review-export-model";

import { env } from "@/config/env";
export const dynamic = "force-dynamic";

/** Dev-only serializer preview. Never queries private data or issues an auth session. */
export default function ProjectCsvFixture() {
  if (process.env.NODE_ENV !== "development" || env.UX_G182_EXPORT_FIXTURE !== "1") notFound();
  const when = new Date("2026-11-07T13:00:00Z");
  const items = [
    {
      id: "class-teams",
      sample: exportClassTeamsCsv([{name: "తెలుగు Team", membershipIds: ["member-1"]}], new Map([["member-1", "\u2060=HYPERLINK(1)"]])),
      empty: exportClassTeamsCsv([], new Map()),
    },
    {
      id: "learner-activity",
      sample: learnerProjectActivityCsv([{occurredAt: when, actorDisplayName: "\u202e+FORMULA", subjectLabel: null, summary: "a".repeat(239) + "😀tail"}]).content,
      empty: learnerProjectActivityCsv([]).content,
    },
    {
      id: "mentor-activity",
      sample: mentorActivityCsv([{id: "event-1", label: "=FORMULA", importance: "HIGH", occurredAt: when}], 2),
      empty: mentorActivityCsv([], 0),
    },
    {
      id: "mentor-calendar",
      sample: mentorCalendarCsv([], 3),
      empty: mentorCalendarCsv([], 0),
    },
    {
      id: "mentor-portfolio",
      sample: mentorPortfolioActivityCsv([{id:"event-1",projectTitle:"Example Project",label:"=FORMULA",importance:"HIGH",occurredAt:when}],2),
      empty: mentorPortfolioActivityCsv([],0),
    },
    {
      id: "mentor-reviews",
      sample: mentorReviewExportCsv([{projectId:"project-1",projectTitle:"Example Project",occurredAt:when}],4),
      empty: mentorReviewExportCsv([],0),
    },
    {
      id: "mentor-task-reviews",
      sample: mentorReviewedTasksCsv([{id:"review-1",projectTitle:"Example Project",taskTitle:"@Untrusted task",status:"APPROVED",version:1,reviewedAt:when}],5),
      empty: mentorReviewedTasksCsv([],0),
    },
  ] as const;
  return <main className="mx-auto max-w-4xl min-w-0 space-y-5 px-4 py-6">
    <h1 className="text-2xl font-semibold">Project export test downloads</h1>
    <p role="note">Synthetic serializer samples only. No user, membership or tenant data is fetched.</p>
    <div className="grid min-w-0 gap-4">
      {items.map(item => <section key={item.id} aria-label={item.id}
        className="min-w-0 space-y-3 rounded-lg border border-border p-3">
        <h2 className="break-words font-semibold">{item.id}</h2>
        <div className="flex min-w-0 flex-wrap gap-3">
          {(["sample","empty"] as const).map(kind => <a key={kind}
            href={"data:text/csv;charset=utf-8," + encodeURIComponent(item[kind])}
            download={item.id+"-"+kind+".csv"}
            className="inline-flex min-h-11 max-w-full items-center break-words rounded-md border border-border px-3 py-2 underline focus-visible:outline-2">
            {"Download "+item.id+" "+kind}
          </a>)}
        </div>
      </section>)}
    </div>
  </main>;
}
