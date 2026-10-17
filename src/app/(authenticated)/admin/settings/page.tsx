import { getCurrentRequestContext } from "@/auth/request-context";
import {getCollegeAttendancePolicy} from "@/modules/attendance/policy-service";
import {SuperAdminAttendanceSettingsEditor} from "@/components/admin/super-admin-attendance-settings-editor";
import {TenantSettingsEditor} from "@/components/admin/tenant-settings-editor";
import {listAdminTenantSettings} from "@/modules/platform-settings/admin-editor-service";
import {parseAdminInventoryQuery,filterPlatformInventory} from "@/modules/platform-settings/admin-inventory-filter";
import {ErrorState} from "@/components/ui/error-state";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import {requirePermission} from "@/modules/permissions/policy";
import {
  formatPlatformSettingValue,
  platformSettingOriginLabel,
} from "@/modules/platform-settings/model";
import {
  getSuperAdminPlatformSettings,
} from "@/modules/platform-settings/service";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettingsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const context =
    await getCurrentRequestContext();

  requirePermission(context,"admin-scope.select");
  const raw=await searchParams;
  const parsed=parseAdminInventoryQuery(raw);
  if(!parsed) return <ErrorState title="Invalid setting filter" description="Use a valid section or search query." action={<Link href="/admin/settings">Clear filters</Link>}/>;
  const { selectedCollegeName, sections: allSections } =
    await getSuperAdminPlatformSettings(context);
  const sections=filterPlatformInventory(allSections,parsed);
  const editorScope=context.adminScope?.collegeId?"COLLEGE":"GLOBAL";
  const editorData=editorScope==="COLLEGE"&&context.adminScope?.collegeId
   ?await listAdminTenantSettings(context,"COLLEGE",context.adminScope.collegeId)
   :editorScope==="GLOBAL"&&!context.adminScope?.organizationId
    ?await listAdminTenantSettings(context,"GLOBAL"):null;
  const attendancePolicy=context.adminScope?.collegeId
    ?await getCollegeAttendancePolicy(context,context.adminScope.collegeId):null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Platform"
        title="Tenant Settings"
        description="Inventory of effective source limits and college policy values. Attendance settings can be edited for the selected college."
      />

      <section
        role="status"
        aria-label="Settings scope"
        className="rounded-xl border border-border bg-surface-subtle p-4 text-sm leading-6 text-body"
      >
        <p className="font-semibold text-foreground">
          {selectedCollegeName
            ? `Selected college: ${selectedCollegeName}`
            : "No college selected"}
        </p>
        <p className="mt-1">
          {selectedCollegeName
            ? "Per-college rows show persisted policy values where available, otherwise their established source defaults."
            : "Fixed platform values are shown. Per-college rows show fallback defaults only; select a college using the Super Admin scope selector to see its effective policy overrides."}
        </p>
      </section>

      {editorData?<TenantSettingsEditor key={editorScope+":"+(context.adminScope?.collegeId??"GLOBAL")} scopeType={editorScope}
       collegeId={context.adminScope?.collegeId??undefined}
       ready={editorData.ready} entries={editorData.entries}/>:(
       <p role="status" className="rounded-xl border border-border p-4 text-sm text-body">
        Clear the Super Admin safety scope to access global setting overrides, or select an individual college to edit its scoped settings.
       </p>)}
      {attendancePolicy?<SuperAdminAttendanceSettingsEditor
        collegeId={attendancePolicy.college.id}
        eligibilityThresholdPercent={attendancePolicy.policy.eligibilityThresholdPercent}
        correctionWindowHours={attendancePolicy.policy.correctionWindowHours}
        maxCorrectionHours={attendancePolicy.maxCorrectionHours}/>:null}
      <Link href="/admin/settings/auth"
        className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
        Authentication and privileged access checklist →
      </Link>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="grid min-w-48 flex-1 gap-1 text-sm font-semibold text-body">Setting or source
          <input name="q" defaultValue={parsed.q} maxLength={100} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground"/>
        </label>
        <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Section
          <select name="section" defaultValue={parsed.section} className="min-h-11 rounded-md border border-border bg-background px-3 text-foreground">
            <option value="ALL">All settings</option>{allSections.map(section=><option key={section.id} value={section.id}>{section.title}</option>)}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary">Filter</button>
        <Link href="/admin/settings" className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear</Link>
      </form>
      {sections.length===0 ? <p role="status" className="rounded-lg border border-border p-4 text-sm text-body">No visible settings match the selected filters.</p> : null}
      <nav
        aria-label="Settings sections"
        className="flex flex-wrap gap-2"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
          >
            {section.title}
          </a>
        ))}
      </nav>

      {sections.map((section) => (
        <section
          id={section.id}
          key={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="space-y-4 scroll-mt-8"
        >
          <div>
            <h2
              id={`${section.id}-heading`}
              className="text-lg font-semibold text-foreground"
            >
              {section.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-body">
              {section.description}
            </p>
          </div>

          <div className="grid min-w-0 gap-3 lg:hidden" aria-label={`${section.title} setting cards`}>
            {section.items.map(setting=><article key={setting.label} className="min-w-0 rounded-xl border border-border bg-surface p-4">
              <h3 className="break-words text-sm font-semibold text-foreground">{setting.label}</h3>
              <p className="mt-2 break-words text-base font-semibold text-foreground">{formatPlatformSettingValue(setting)}</p>
              <p className="mt-2 text-xs text-body">Origin: {platformSettingOriginLabel(setting.origin)}</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">Source: {setting.source}</p>
            </article>)}
          </div>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface lg:block">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <thead className="bg-surface-subtle">
                <tr>
                  {[
                    "Setting",
                    "Value",
                    "Origin",
                    "Source file or table",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="border-b border-border px-4 py-3 font-semibold text-foreground"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.items.map((setting) => (
                  <tr
                    key={`${section.id}:${setting.label}`}
                    className="border-b border-border last:border-0"
                  >
                    <th
                      scope="row"
                      className="px-4 py-3 font-semibold text-foreground"
                    >
                      {setting.label}
                    </th>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-foreground">
                      {formatPlatformSettingValue(setting)}
                    </td>
                    <td className="px-4 py-3 text-body">
                      {platformSettingOriginLabel(
                        setting.origin,
                      )}
                    </td>
                    <td className="break-all px-4 py-3 font-mono text-xs text-muted-foreground">
                      {setting.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {section.smsTemplates ? (
            <>
            <div className="grid min-w-0 gap-3 lg:hidden" aria-label="SMS source template cards">
              {section.smsTemplates.map(template=><article key={template.key} className="min-w-0 rounded-xl border border-border bg-surface p-4">
                <h3 className="break-all text-sm font-semibold">{template.key}</h3>
                <p className="mt-2 text-sm text-body">{template.purpose}</p>
                <p className="mt-2 break-words text-xs text-body">Channels: {template.channels.join(", ")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{template.definition==="FIXED_OTP_SOURCE"?"Fixed OTP source template":"Declared intent key; no active sender implied"}</p>
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{template.source}</p>
              </article>)}
            </div>
            <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface lg:block">
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <thead className="bg-surface-subtle">
                  <tr>
                    {[
                      "Source template / key",
                      "Purpose",
                      "Declared channels",
                      "Definition",
                      "Source file",
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="border-b border-border px-4 py-3 font-semibold text-foreground"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.smsTemplates.map((template) => (
                    <tr
                      key={template.key}
                      className="border-b border-border last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-4 py-3 font-semibold text-foreground"
                      >
                        {template.key}
                      </th>
                      <td className="px-4 py-3 text-body">{template.purpose}</td>
                      <td className="px-4 py-3 text-body">
                        {template.channels.join(", ")}
                      </td>
                      <td className="px-4 py-3 text-body">
                        {template.definition === "FIXED_OTP_SOURCE"
                          ? "Fixed source OTP template"
                          : "Fixed intent key, not an operational sender"}
                      </td>
                      <td className="break-all px-4 py-3 font-mono text-xs text-muted-foreground">
                        {template.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : null}

          {section.note ? (
            <p className="rounded-lg bg-surface-subtle px-4 py-3 text-xs leading-6 text-body">
              {section.note}
            </p>
          ) : null}
        </section>
      ))}

      <p className="text-xs leading-6 text-muted-foreground">
        Inventory scope is intentionally limited to
        non-secret numeric and boolean values and fixed source
        template names or intent keys.
        Environment variables, credentials, API keys,
        tokens, connection details and custom
        configuration blobs are neither read nor
        displayed. The editor above stores typed, audited overrides; deployment-managed auth controls require separate activation.
      </p>
    </div>
  );
}
