import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DeviceList } from "@/components/auth/device-list";
import { TpoTimedDebarControl } from "@/components/tpo/tpo-timed-debar-control";
import { TpoTopbarNewMenu } from "@/components/tpo/tpo-topbar-new-menu";
import { ToastProvider } from "@/components/ui/toast";
import type { TpoTimedDebarRow } from "@/modules/placements/tpo-timed-debar-view-model";

export const dynamic = "force-dynamic";

const active: TpoTimedDebarRow[] = [
  {id:"fixture-first",reason:"First review restriction",untilDate:null,
   untilDrives:null,drivesCounted:0,createdAt:"2026-11-07T09:00:00.000Z",
   liftedAt:null,liftedReason:null,active:true},
  {id:"fixture-second",reason:"Second review restriction",untilDate:null,
   untilDrives:2,drivesCounted:1,createdAt:"2026-11-07T10:00:00.000Z",
   liftedAt:null,liftedReason:null,active:true},
];

/**
 * Auth-free, synthetic-data-only component acceptance route.
 * Never exposed by a production build even when the fixture flag is set.
 */
export default function AuthTpoUxFixture() {
  if (process.env.NODE_ENV !== "development" ||
      process.env.UX_G160_G133_FIXTURE !== "1") notFound();

  return <main id="lms-main-content"
    className="mx-auto w-full max-w-[70rem] min-w-0 space-y-8 px-4 py-6 md:px-8">
    <h1 className="text-2xl font-bold">UX control acceptance fixture</h1>
    <ToastProvider>
      <section data-ux-fixture="debar-active" className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="text-xl font-semibold">Existing restrictions</h2>
        <TpoTimedDebarControl membershipId="00000000-0000-4000-8000-000000000111" initial={active}/>
      </section>
      <section data-ux-fixture="debar-create" className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="text-xl font-semibold">Create restriction</h2>
        <TpoTimedDebarControl membershipId="00000000-0000-4000-8000-000000000222" initial={[]}/>
      </section>
      <section data-ux-fixture="devices" className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="text-xl font-semibold">Signed-in devices</h2>
        <DeviceList devices={[
          {id:"fixture-current",label:"Current test browser",current:true,
           createdAt:"2026-11-07T09:00:00.000Z",lastSeenAt:"2026-11-07T10:00:00.000Z"},
          {id:"fixture-other",label:"Other test browser",current:false,
           createdAt:"2026-11-06T09:00:00.000Z",lastSeenAt:"2026-11-06T10:00:00.000Z"},
        ]}/>
      </section>
      <section data-ux-fixture="topbar" className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="text-xl font-semibold">New placement actions</h2>
        <Suspense fallback={<p role="status">Loading placement actions…</p>}>
          <TpoTopbarNewMenu collegeId="00000000-0000-4000-8000-000000000333"/>
        </Suspense>
      </section>
    </ToastProvider>
  </main>;
}
