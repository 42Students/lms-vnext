import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { ErrorState } from "@/components/ui/error-state";
import { Disclosure } from "@/components/ui/disclosure";
import { AuthorizationError } from "@/modules/permissions/policy";
import Link from "next/link";
import { TpoUnifiedJobTypesEditor } from "@/components/tpo/tpo-unified-job-types-editor";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { getTpoJobTypes, listPlacementJobTypeChoices } from "@/modules/placements/tpo-configuration-read-service";
import { TPO_BUILTIN_JOB_TYPES, isTpoBuiltinJobType } from "@/modules/placements/tpo-builtin-job-types";

export const dynamic = "force-dynamic";
export default async function JobTypesSettings() {
  const context=await getCurrentRequestContext();
  const [config,choices]=await Promise.all([
    getTpoJobTypes(context).catch(error=>{if(error instanceof AuthorizationError)throw error;return null;}),
    listPlacementJobTypeChoices(context,context.membership?.collegeId??null)
      .catch(error=>{if(error instanceof AuthorizationError)throw error;return null;}),
  ]);
  if(!config)return <div className="min-w-0 space-y-5">
    <PageHeader title="Settings" description="Manage placement policy, people and college communication."/>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[224px_minmax(0,1fr)]">
      <TpoSettingsNav active="job-types"/>
      <ErrorState title="Could not load job types"
        description="The job type list is temporarily unavailable. No changes were made."
        retryHref="/tpo/settings/job-types?retry=1" retryLabel="Retry"/>
    </div>
  </div>;
  const {ready,rows,usage}=config;
  const builtin = TPO_BUILTIN_JOB_TYPES.map(fixed => {
    const stored = rows.find(row => row.label.toLowerCase() === fixed.label.toLowerCase());
    return {
      id: stored?.id ?? null,
      label: fixed.label,
      isBuiltin: true,
      countsAsPlaced: fixed.countsAsPlaced,
      active: stored?.active ?? true,
      drives: usage.get(fixed.label.toLowerCase()) ?? 0,
      expectedVersion: stored?.updatedAt.toISOString() ?? "none",
    };
  });
  const custom = rows.filter(row => !row.isBuiltin && !isTpoBuiltinJobType(row.label))
    .map(row => ({
      id: row.id, label: row.label, isBuiltin: false,
      countsAsPlaced: row.countsAsPlaced ?? true, active: row.active,
      drives: row.drives, expectedVersion: row.updatedAt.toISOString(),
    }));
  return <div className="min-w-0 space-y-[var(--lms-space-5)]">
    <PageHeader title="Settings" description="Manage placement policy, people and college communication."/>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[224px_minmax(0,1fr)]">
      <TpoSettingsNav active="job-types"/>
      <section className="min-w-0 space-y-4" aria-labelledby="job-types-title">
        <h2 id="job-types-title" className="text-xl font-semibold text-heading">Job types</h2>
        <p className="text-sm text-muted-foreground">
          The job types drives can have, and whether an offer of each counts as placed. Add your own; switch off the ones you never use.
        </p>
        {!ready ? <Alert tone="warning">Could not load job types. The job type storage is unavailable.
          <Link href="/tpo/settings/job-types?retry=1" className="ml-2 font-semibold text-link underline">Retry</Link>
        </Alert> :
          <div className="space-y-4">
            <TpoUnifiedJobTypesEditor types={[...builtin,...custom]}/>
            <Disclosure title="Visible choices for drives" className="border-t border-border pt-3">
              <section aria-label="Choices available to drive users">
              <h3 className="sr-only">Visible choices for drives</h3>
              <p className="text-xs text-muted-foreground">The same authorized read-only selection is available at /api/placements/job-types. Disabled choices remain on existing drives but are not offered for new ones.</p>
              {choices===null?<p role="alert" className="text-sm text-warning">Could not load the current drive choices.
                <Link href="/tpo/settings/job-types?retry=1" className="ml-2 font-semibold text-link underline">Retry</Link>
              </p>:choices.length?<ul className="mt-2 flex flex-wrap gap-2">{choices.map(item=>
                <li key={item.label} className="rounded border border-border px-2 py-1 text-sm">{item.label}</li>
              )}</ul>:<p className="text-sm text-muted-foreground">No active job types.</p>}
              </section>
            </Disclosure>
          </div>}
      </section>
    </div>
  </div>;
}
