"use client";

import { useMemo, useState, type ComponentType } from "react";
import Case0 from "@/src/app/(authenticated)/admin/placements/drives/error";
import Case1 from "@/src/app/(authenticated)/admin/placements/hiring/error";
import Case2 from "@/src/app/(authenticated)/admin/placements/jobs/[jobId]/error";
import Case3 from "@/src/app/(authenticated)/admin/placements/joining/error";
import Case4 from "@/src/app/(authenticated)/admin/placements/new/error";
import Case5 from "@/src/app/(authenticated)/admin/placements/offers/error";
import Case6 from "@/src/app/(authenticated)/admin/placements/screenings/error";
import Case7 from "@/src/app/(authenticated)/admin/placements/shortlisted/error";
import Case8 from "@/src/app/(authenticated)/admin/placements/student-lookup/error";
import Case9 from "@/src/app/(authenticated)/admin/programs/error";
import Case10 from "@/src/app/(authenticated)/admin/projects/at-risk/error";
import Case11 from "@/src/app/(authenticated)/admin/projects/readiness/error";
import Case12 from "@/src/app/(authenticated)/admin/projects/templates/[templateId]/overview/error";
import Case13 from "@/src/app/(authenticated)/admin/projects/templates/[templateId]/resources/error";
import Case14 from "@/src/app/(authenticated)/admin/quizzes/error";
import Case15 from "@/src/app/(authenticated)/admin/recruiters/error";
import Case16 from "@/src/app/(authenticated)/admin/settings/auth/error";
import Case17 from "@/src/app/(authenticated)/admin/students/error";
import Case18 from "@/src/app/(authenticated)/college/announcements/error";
import Case19 from "@/src/app/(authenticated)/college/attendance/error";

type RecoveryRoute = {
  id: string;
  label: string;
  Component: ComponentType<{ error: Error & { digest?: string }; reset: () => void }>;
};

const routes: RecoveryRoute[] = [
  { id: "g015-drives", label: "Admin drives", Component: Case0 },
  { id: "g015-hiring", label: "Hiring metrics", Component: Case1 },
  { id: "g016-job", label: "Drive overview", Component: Case2 },
  { id: "g016-joining", label: "Joining outcomes", Component: Case3 },
  { id: "g017-new", label: "Create placement", Component: Case4 },
  { id: "g017-offers", label: "Offers directory", Component: Case5 },
  { id: "g018-screenings", label: "Screenings directory", Component: Case6 },
  { id: "g018-shortlist", label: "Shortlist directory", Component: Case7 },
  { id: "g019-lookup", label: "Student lookup", Component: Case8 },
  { id: "g019-programs", label: "Programs directory", Component: Case9 },
  { id: "g020-at-risk", label: "At-risk projects", Component: Case10 },
  { id: "g020-readiness", label: "Project readiness", Component: Case11 },
  { id: "g021-overview", label: "Project template overview", Component: Case12 },
  { id: "g021-resources", label: "Template resources", Component: Case13 },
  { id: "g023-quizzes", label: "Quiz directory", Component: Case14 },
  { id: "g023-recruiters", label: "Recruiter accounts", Component: Case15 },
  { id: "g024-auth", label: "Authentication settings", Component: Case16 },
  { id: "g024-students", label: "Student directory", Component: Case17 },
  { id: "g029-announcements", label: "College communications", Component: Case18 },
  { id: "g029-attendance", label: "College attendance", Component: Case19 },
];

/** Synthetic, privilege-free fixture of real route error components. */
export function UXAdminCollegeRecoveryFixture() {
  const [routeId, setRouteId] = useState(routes[0].id);
  const [retries, setRetries] = useState(0);
  const fakeError = useMemo(() => new Error("SENSITIVE_RUNTIME_SECRET_DO_NOT_RENDER"), []);
  const selected = routes.find(route => route.id === routeId) ?? routes[0];
  const SelectedError = selected.Component;

  return (
    <main className="mx-auto min-w-0 w-full max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Admin and college recovery acceptance</h1>
      <p className="text-sm text-muted-foreground">
        Synthetic error only: no accounts, placement records or tenant information are loaded.
      </p>
      <label className="flex min-w-0 max-w-md flex-col gap-2 text-sm font-medium" htmlFor="recovery-route">
        Route to inspect
        <select
          id="recovery-route"
          className="min-h-11 w-full rounded-md border border-border bg-surface px-3"
          value={routeId}
          onChange={event => { setRouteId(event.target.value); setRetries(0); }}
        >
          {routes.map(route => <option key={route.id} value={route.id}>{route.label}</option>)}
        </select>
      </label>
      <p data-testid="recovery-count" role="status">Retry count: {retries}</p>
      <section aria-label="Selected error recovery" className="min-w-0 max-w-full rounded-lg border border-border p-4">
        <SelectedError key={routeId} error={fakeError} reset={() => setRetries(value => value + 1)} />
      </section>
    </main>
  );
}
