import { notFound } from "next/navigation";
import { FacultyAttendanceScheduleEditor } from "@/components/attendance/faculty-attendance-schedule-editor";

import { env } from "@/config/env";
export const dynamic = "force-dynamic";

/** Development-only UI witness. No account, membership, database or write session is created. */
export default function FacultyScheduleUxFixture() {
  if (process.env.NODE_ENV !== "development" ||
    env.UX_G132_SCHEDULE_FIXTURE !== "1") notFound();
  return <main className="mx-auto w-full max-w-4xl min-w-0 space-y-6 px-4 py-8">
    <h1 className="text-2xl font-semibold">Faculty attendance schedule preview</h1>
    <FacultyAttendanceScheduleEditor
      deliveryId="00000000-0000-4000-8000-000000000001"
      sessions={[{
        id:"00000000-0000-4000-8000-000000000002",
        title:"Existing unmarked class",
        startsAt:"2099-01-04T04:30:00.000Z",
        endsAt:"2099-01-04T05:30:00.000Z",
        updatedAt:"2098-12-01T00:00:00.000Z",
        marked:false,
        description:null,
        location:"Room A",
      }]}
    />
  </main>;
}
