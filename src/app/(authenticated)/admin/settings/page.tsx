import { getCurrentRequestContext } from "@/auth/request-context";
import {getCollegeAttendancePolicy} from "@/modules/attendance/policy-service";
import {SuperAdminAttendanceSettingsEditor} from "@/components/admin/super-admin-attendance-settings-editor";
import {TenantSettingsEditor} from "@/components/admin/tenant-settings-editor";
import {listAdminTenantSettings} from "@/modules/platform-settings/admin-editor-service";
import {parseAdminInventoryQuery,filterPlatformInventory} from "@/modules/platform-settings/admin-inventory-filter";
import {ErrorState} from "@/components/ui/error-state";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {DataTable} from "@/components/ui/data-table";
import {can} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {adminControlScopeTag} from "@/modules/module-access/admin-control-overview-model";
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

  if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
    return <div className="min-w-0 space-y-6">
      <PageHeader eyebrow="Super Admin · Platform" title="Tenant Settings"/>
      <ErrorState title="Tenant settings access denied"
        description="Your account cannot access privileged tenant settings."
        action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
    </div>;
  const raw=await searchParams;
  const parsed=parseAdminInventoryQuery(raw);
  if(!parsed) return <ErrorState title="Invalid setting filter" description="Use a valid section or search query." action={<Link href="/admin/settings">Clear filters</Link>}/>;
  const retryParams=new URLSearchParams();
  if(parsed.q)retryParams.set("q",parsed.q);
  if(parsed.section!=="ALL")retryParams.set("section",parsed.section);
  const retrySuffix=retryParams.toString();
  const platform=await getSuperAdminPlatformSettings(context)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}));
  if(!platform.ok)
    return <div className="min-w-0 space-y-6">
      <PageHeader eyebrow="Super Admin · Platform" title="Tenant Settings"/>
      <ErrorState title="Tenant settings unavailable"
        description="The settings inventory could not be loaded. Your filters have not changed."
        action={<Link href={"/admin/settings"+(retrySuffix?"?"+retrySuffix:"")} className="font-semibold text-primary-text underline">Retry loading settings</Link>}/>
    </div>;
  const {selectedCollegeName,sections:allSections}=platform.value;
  const sections=filterPlatformInventory(allSections,parsed);
  const editorScope=context.adminScope?.collegeId?"COLLEGE":"GLOBAL";
  const editorResult=editorScope==="COLLEGE"&&context.adminScope?.collegeId
   ?await listAdminTenantSettings(context,"COLLEGE",context.adminScope.collegeId)
     .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}))
   :editorScope==="GLOBAL"&&!context.adminScope?.organizationId
    ?await listAdminTenantSettings(context,"GLOBAL")
      .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}))
    :null;
  const editorData=editorResult?.ok?editorResult.value:null;
  const attendanceResult=context.adminScope?.collegeId
    ?await getCollegeAttendancePolicy(context,context.adminScope.collegeId)
      .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}))
    :null;
  const attendancePolicy=attendanceResult?.ok?attendanceResult.value:null;
  const scopeLabel=adminControlScopeTag(context.adminScope);
  const documentedControls=allSections.reduce((sum,section)=>sum+section.items.length,0);


  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Super Admin · Platform"
        title="Tenant Settings"
        description="Inventory of effective source limits and college policy values. Attendance settings can be edited for the selected college."
        actions={<Link href="/admin/settings/auth"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Authentication and privileged access checklist →</Link>}
      />

      <section aria-label="Tenant Settings overview" className="border-b border-border pb-5">
        <p className="text-sm font-semibold">Runtime configuration · {scopeLabel}</p>
        <h2 className="mt-1 text-base font-semibold">Settings with explicit execution scope</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt>Documented controls</dt><dd className="font-semibold">{documentedControls} visible inventory settings</dd></div>
          <div><dt>Stored keys</dt><dd className="font-semibold">{editorData?.ready?editorData.entries.length:"Unavailable"} in this scope</dd></div>
          <div><dt>Editing</dt><dd className="font-semibold">{editorData?.ready?scopeLabel:"Select an authorized scope"}</dd></div>
        </dl>
      </section>
      <section
        role="status"
        aria-label="Settings scope"
        className="text-sm leading-6 text-body border-t border-border pt-5"
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
       <Banner tone="warning">
        {editorResult&&!editorResult.ok
          ?"Tenant settings editor is temporarily unavailable. Existing settings were not changed."
          :"Clear the Super Admin safety scope to access global setting overrides, or select an individual college to edit its scoped settings."}
       </Banner>)}
      {attendanceResult&&!attendanceResult.ok?
        <Banner tone="warning">
          Attendance policy is temporarily unavailable. Existing settings were not changed.
        </Banner>:null}
      {attendancePolicy?<SuperAdminAttendanceSettingsEditor
        collegeId={attendancePolicy.college.id}
        eligibilityThresholdPercent={attendancePolicy.policy.eligibilityThresholdPercent}
        correctionWindowHours={attendancePolicy.policy.correctionWindowHours}
        maxCorrectionHours={attendancePolicy.maxCorrectionHours}/>:null}

      <form className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border pb-4">
        <label className="grid min-w-48 flex-1 gap-1 text-sm font-semibold text-body">Setting or source
          <Input name="q" defaultValue={parsed.q} maxLength={100} className="min-h-11 sm:min-h-9"/>
        </label>
        <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Section
          <Select name="section" defaultValue={parsed.section} className="min-h-11 sm:min-h-9">
            <option value="ALL">All settings</option>{allSections.map(section=><option key={section.id} value={section.id}>{section.title}</option>)}
          </Select>
        </label>
        <Button type="submit">Filter</Button>
        <Link href="/admin/settings" className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear</Link>
      </form>
      {sections.length===0 ? <p role="status" className="border-l-2 border-border bg-muted px-3 py-2 text-sm text-body">No visible settings match the selected filters.</p> : null}
      <nav
        aria-label="Settings sections"
        className="flex flex-wrap gap-2 border-b border-border"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex min-h-11 items-center border-b-[3px] border-transparent px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle sm:min-h-9"
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

          <DataTable<(typeof section.items)[number]>
            caption={section.title}
            rows={section.items}
            getRowKey={setting=>section.id+":"+setting.label}
            columns={[
              {key:"setting",header:"Setting",mobilePriority:"primary",cell:setting=>
                <span className="break-words font-semibold text-foreground">{setting.label}</span>},
              {key:"value",header:"Value",mobilePriority:"secondary",cell:setting=>
                <span className="break-words font-semibold tabular-nums">{formatPlatformSettingValue(setting)}</span>},
              {key:"origin",header:"Origin",mobilePriority:"secondary",cell:setting=>platformSettingOriginLabel(setting.origin)},
              {key:"source",header:"Source file or table",mobilePriority:"secondary",cell:setting=>
                <span className="break-all font-mono text-xs">{setting.source}</span>},
            ]}
            empty={<p role="status" className="text-sm text-body">No visible settings match the selected filters.</p>}
          />

          {section.smsTemplates ? (
            <>
            <DataTable<NonNullable<typeof section.smsTemplates>[number]>
              caption="SMS source templates"
              rows={section.smsTemplates}
              getRowKey={template=>template.key}
              columns={[
                {key:"template",header:"Source template / key",mobilePriority:"primary",cell:template=>
                  <span className="break-all font-semibold">{template.key}</span>},
                {key:"purpose",header:"Purpose",mobilePriority:"secondary",cell:template=>template.purpose},
                {key:"channels",header:"Declared channels",mobilePriority:"secondary",cell:template=>template.channels.join(", ")},
                {key:"definition",header:"Definition",mobilePriority:"secondary",cell:template=>
                  template.definition==="FIXED_OTP_SOURCE"?"Fixed source OTP template":"Fixed intent key, not an operational sender"},
                {key:"source",header:"Source file",mobilePriority:"secondary",cell:template=>
                  <span className="break-all font-mono text-xs">{template.source}</span>},
              ]}
              empty={<p role="status" className="text-sm text-body">No source templates match the selected filters.</p>}
            />
            </>
          ) : null}

          {section.note ? (
            <p className="rounded-[var(--lms-control-radius,9px)] bg-surface-subtle px-4 py-3 text-xs leading-6 text-body">
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
