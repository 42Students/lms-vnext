import { getCurrentRequestContext } from "@/auth/request-context";
import {getCollegeAttendancePolicy} from "@/modules/attendance/policy-service";
import {SuperAdminAttendanceSettingsEditor} from "@/components/admin/super-admin-attendance-settings-editor";
import {TenantSettingsEditor} from "@/components/admin/tenant-settings-editor";
import {listAdminTenantSettings} from "@/modules/platform-settings/admin-editor-service";
import {parseAdminInventoryQuery,filterPlatformInventory} from "@/modules/platform-settings/admin-inventory-filter";
import {ErrorState} from "@/components/ui/error-state";
import {EmptyState} from "@/components/ui/empty-state";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
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
    return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader title="Tenant Settings"/>
      <ErrorState title="Tenant settings access denied"
        description="Your account cannot access privileged tenant settings."
        action={<PageBackLink href="/dashboard" label="Back to dashboard" />}/>
    </div>;
  const raw=await searchParams;
  const parsed=parseAdminInventoryQuery(raw);
  if(!parsed) return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Tenant Settings"/>
    <ErrorState title="Invalid setting filter" description="Use a valid section or search query."
      action={<Link href="/admin/settings" className="inline-flex items-center min-h-11 md:min-h-9 font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>}/>
  </div>;
  const retryParams=new URLSearchParams();
  if(parsed.q)retryParams.set("q",parsed.q);
  if(parsed.section!=="ALL")retryParams.set("section",parsed.section);
  const retrySuffix=retryParams.toString();
  const platform=await getSuperAdminPlatformSettings(context)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}));
  if(!platform.ok)
    return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader title="Tenant Settings"/>
      <ErrorState title="Tenant settings unavailable"
        description="The settings inventory could not be loaded. Your filters have not changed."
        action={<Link href={"/admin/settings"+(retrySuffix?"?"+retrySuffix:"")} className="inline-flex items-center min-h-11 md:min-h-9 font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Retry loading settings</Link>}/>
    </div>;
  const {selectedCollegeName,sections:allSections}=platform.value;
  const sections=filterPlatformInventory(allSections,parsed);
  const organizationOnly=Boolean(context.adminScope?.organizationId&&!context.adminScope?.collegeId);
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
  const documentedControls=allSections.reduce((sum,section)=>sum+section.items.filter(item=>
    editorScope==="COLLEGE"?item.origin!=="PLATFORM":item.origin!=="COLLEGE").length,0);
  const editingLabel=organizationOnly?"Disabled":editorData?.ready?"Available":"Select scope";


  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Tenant Settings"
        description="Inventory of effective source limits and college policy values. Attendance settings can be edited for the selected college."
        actions={<Link href="/admin/settings/auth"
          className="inline-flex min-h-11 w-full items-center justify-center text-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text md:min-h-9 md:w-auto hover:border-[var(--lms-button-primary)] hover:bg-[var(--lms-button-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Authentication and privileged access checklist →</Link>}
      />

      <section aria-label="Tenant Settings overview" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-body">Runtime configuration</p>
          <span className="rounded-full border border-[var(--lms-primary)] bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary-text">{scopeLabel}</span>
        </div>
        <h2 className="mt-1 break-words text-lg font-semibold leading-7 text-[var(--lms-heading)]">Settings with explicit execution scope</h2>
        <p className="text-sm leading-6 text-body">These values are not an inheritance tree: each backend reader asks for one exact scope. The page therefore keeps platform and college settings separate and blocks new organization-level values that nothing consumes.</p>
        <dl className="mt-3 grid min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)] text-[14px] leading-5 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Documented controls</dt><dd className="mt-2 break-words text-xl font-semibold tabular-nums leading-7 text-[var(--lms-heading)]">{documentedControls}</dd></div>
          <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stored keys</dt><dd className="mt-2 font-semibold tabular-nums text-[24px] leading-[1.3] text-[var(--lms-heading)]">{editorData?.ready?editorData.entries.length:"Unavailable"}</dd></div>
          <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Editing</dt><dd className="mt-2 break-words font-semibold text-[var(--lms-body-text)]">{editingLabel}</dd></div>
        </dl>
      </section>
      <Banner tone="info" role="status">
        <p className="font-semibold">Each setting applies at one level only</p>
        <p className="mt-2">A setting is either platform-wide or per college, never both: a college does not fall back to the platform value, it falls back to the built-in default. Each setting below is listed only at the level where it takes effect.</p>
        <p className="mt-2 text-xs">This screen is configuration values only. For organization or college setup, web addresses and branding, use <Link href="/admin/tenants" className="font-semibold underline">Tenant Setup</Link>.</p>
      </Banner>
      <section
        role="status"
        aria-label="Settings scope"
        className="break-words text-sm leading-6 text-body border-t border-border pt-4"
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

      <section aria-label="Tenant setting scope modes" className="border-b border-border pb-4">
        <h2 className="text-sm font-semibold text-[var(--lms-heading)]">Setting scope</h2>
        <p className="mt-2 text-sm leading-6 text-body">
          Global settings · Organization (no applicable setting overrides) · College settings
        </p>
        {organizationOnly?<Banner tone="warning" role="status" className="mt-3">
          <strong>No setting applies at organization level.</strong> No runtime reader consumes organization-level settings. Existing stored keys are for inspection or cleanup only; adding or saving ORG settings is disabled. Choose Global for platform-wide values or College for per-college settings.
        </Banner>:null}
        {context.adminScope?.collegeId?<Banner tone="warning" role="status" className="mt-3">
          <strong>Clear the college in the header to edit platform-wide settings</strong>
          <p className="mt-2">While a college is selected, platform-wide settings are locked, so a change for every college is never made by accident while working on one.</p>
        </Banner>:null}
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
          <span className="text-sm font-semibold">Editing scope:</span>
          <span className="rounded-md border border-border px-3 py-2 text-sm">{organizationOnly?"Organization — unused":editorScope==="COLLEGE"?"College settings":"Platform-wide settings"}</span>
          <Link href="/admin/tenants" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Choose another scope</Link>
          <Link href={"/admin/settings"+(retrySuffix?"?"+retrySuffix:"")} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Refresh</Link>
        </div>
      </section>
      {editorData?<TenantSettingsEditor key={editorScope+":"+(context.adminScope?.collegeId??"GLOBAL")} scopeType={editorScope}
       collegeId={context.adminScope?.collegeId??undefined}
       ready={editorData.ready} entries={editorData.entries}/>:(
       <Banner tone="warning">
        {organizationOnly?<p className="font-semibold">Select a college to view its settings.</p>:null}
        {editorResult&&!editorResult.ok
          ?"Settings could not be loaded or saved safely. Existing settings were not changed."
          :organizationOnly
          ?"No setting applies at organization level."
          :"Clear the Super Admin safety scope to access global setting overrides, or select an individual college to edit its scoped settings."}
        {editorResult&&!editorResult.ok ? <Link
          href={"/admin/settings"+(retrySuffix?"?"+retrySuffix:"")}
          className="ml-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Retry
        </Link> : null}
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
      <form className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]" aria-label="Filter tenant settings">
        <label className="grid min-w-48 flex-1 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Setting or source
          <Input name="q" defaultValue={parsed.q} maxLength={100} className="min-h-11 md:min-h-9"/>
        </label>
        <label className="grid min-w-36 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
          <Select name="section" defaultValue={parsed.section} className="min-h-11 md:min-h-9">
            <option value="ALL">All settings</option>{allSections.map(section=><option key={section.id} value={section.id}>{section.title}</option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
        <Link href="/admin/settings" className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-primary-text underline-offset-2 transition-colors duration-150 hover:underline hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear</Link>
      </form>
      {sections.length===0 ? <EmptyState title="No visible settings" description="No visible settings match the selected filters."
        action={<Link href="/admin/settings" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary w-full md:w-auto md:min-h-9">Clear filters</Link>}/> : null}
      {sections.length ? <nav
        aria-label="Settings sections"
        className="flex min-w-0 gap-[var(--lms-tab-gap)] min-[1600px]:gap-[40px] overflow-x-auto border-b border-[var(--lms-canvas-border)] pb-0"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="relative inline-flex min-h-11 min-[768px]:min-h-[29px] shrink-0 items-center justify-center whitespace-nowrap border-0 px-0 pb-[13px] pt-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-[3px] after:w-0 after:-translate-x-1/2 after:bg-[var(--lms-primary)] after:opacity-0 after:transition-[width,opacity] after:duration-200 hover:text-[var(--lms-primary-text)] hover:after:w-full hover:after:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] motion-reduce:after:transition-none"
          >
            {section.title}
          </a>
        ))}
      </nav> : null}

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
              className="m-0 break-words text-lg font-semibold leading-7 text-[var(--lms-heading)]"
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
            empty={<EmptyState title="No visible settings" description="No visible settings match the selected filters."/>}
          />

          {section.smsTemplates ? (
            <>
            <p className="text-sm leading-6 text-body">
              These are source templates, not evidence that an SMS was sent,
              accepted by a provider or delivered. Provider attempt statuses remain unavailable here.
              <Link href="/admin/audit#sms-delivery-attempts"
                className="ml-2 inline-flex min-h-9 items-center font-semibold text-primary-text underline">
                SMS delivery attempts
              </Link>
            </p>
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
              empty={<EmptyState title="No matching source templates" description="No source templates match the selected filters."/>}
            />
            </>
          ) : null}

          {section.note ? (
            <p className="border-b border-border py-3 text-xs leading-6 text-body">
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
