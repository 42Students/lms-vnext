import { redirect } from "next/navigation";
import { z } from "zod";

/** The old Interviews page was an alias for Schedule, not another independent
 * workspace. Keep only bounded deep-link selectors; never forward arbitrary
 * tenant/learner overrides through this redirect. */
export default async function LearnerPlacementInterviewsPage({ searchParams }: {
  searchParams: Promise<{
    applicationId?: string | string[];
    roundId?: string | string[];
    view?: string | string[];
    q?: string | string[];
  }>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  const view = typeof raw.view === "string" ? raw.view : "";
  if (view === "past" || view === "upcoming" || view === "ahead") {
    params.set("view", view === "ahead" ? "upcoming" : view);
  } else if (view === "month" || view === "calendar") {
    params.set("view", "calendar");
  }
  for (const key of ["applicationId", "roundId"] as const) {
    const value = raw[key];
    if (typeof value === "string" && z.uuid().safeParse(value).success) {
      params.set(key, value);
    }
  }
  const q = raw.q;
  if (typeof q === "string" && q.trim().length <= 100 && q.trim()) {
    params.set("q", q.trim());
  }
  const query = params.toString();
  redirect("/learn/my-placements/schedule" + (query ? "?" + query : ""));
}
