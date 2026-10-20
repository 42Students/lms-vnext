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
    return <div className="min-w-0 max-w-full space-y-6">
      <PageHeader title="Tenant Settings"/>
      <ErrorState title="Tenant settings access denied"
        description="Your account cannot access privileged tenant settings."
        action={<PageBackLink href="/dashboard" label="Back to dashboard" />}/>
    </div>;
  const raw=await searchParams;
  const parsed=parseAdminInventoryQuery(raw);
  if(!parsed) return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title="Tenant Settings"/>
    <ErrorState title="Invalid setting filter" description="Use a valid section or search query."
      action={<Link href="/admin/settings" className="inline-flex items-center min-h-11 md:min-h-9 font-semibold text-primary-text underline">Clear filters</Link>}/>
  </div>;
  const retryParams=new URLSearchParams();
  if(parsed.q)retryParams.set("q",parsed.q);
  if(parsed.section!=="ALL")retryParams.set("section",parsed.section);
  const retrySuffix=retryParams.toString();
  const platform=await getSuperAdminPlatformSettings(context)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}));
  if(!platform.ok)
    return <div className="min-w-0 max-w-full space-y-6">
      <PageHeader title="Tenant Settings"/>
      <ErrorState title="Tenant settings unavailable"
        description="The settings inventory could not be loaded. Your filters have not changed."
        action={<Link href={"/admin/settings"+(retrySuffix?"?"+retrySuffix:"")} className="inline-flex items-center min-h-11 md:min-h-9 font-semibold text-primary-text underline">Retry loading settings</Link>}/>
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
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader
        title="Tenant Settings"
        description="Inventory of effective source limits and college policy values. Attendance settings can be edited for the selected college."
        actions={<Link href="/admin/settings/auth"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">Authentication and privileged access checklist →</Link>}
      />

      <section aria-label="Tenant Settings overview" className="border-b border-border pb-6">
        <p className="text-sm font-semibold text-body">Runtime configuration · {scopeLabel}</p>
        <h2 className="mt-1 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-xl)] leading-[30px] min-[768px]:text-[22px] min-[768px]:leading-[32px] min-[992px]:text-[var(--lms-font-3xl)] min-[992px]:leading-[40px]">Settings with explicit execution scope</h2>
        <dl className="mt-3 grid min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)] text-[14px] leading-5 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Documented controls</dt><dd className="mt-2 font-semibold tabular-nums text-[24px] leading-[1.3] text-[var(--lms-heading)]">{documentedControls} visible inventory settings</dd></div>
          <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Stored keys</dt><dd className="mt-2 font-semibold tabular-nums text-[24px] leading-[1.3] text-[var(--lms-heading)]">{editorData?.ready?editorData.entries.length:"Unavailable"} in this scope</dd></div>
          <div className="min-w-0 px-4 py-3"><dt className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Editing</dt><dd className="mt-2 break-words font-semibold text-[var(--lms-body-text)]">{editorData?.ready?scopeLabel:"Select an authorized scope"}</dd></div>
        </dl>
      </section>
      <section
        role="status"
        aria-label="Settings scope"
        className="text-sm leading-6 text-body border-t border-border pt-6"
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
      <form className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border pb-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="grid min-w-48 flex-1 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Setting or source
          <Input name="q" defaultValue={parsed.q} maxLength={100} className="min-h-11 md:min-h-9"/>
        </label>
        <label className="grid min-w-36 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
          <Select name="section" defaultValue={parsed.section} className="min-h-11 md:min-h-9">
            <option value="ALL">All settings</option>{allSections.map(section=><option key={section.id} value={section.id}>{section.title}</option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11 min-[768px]:min-h-9">Filter</Button>
        <Link href="/admin/settings" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline-offset-2 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear</Link>
      </form>
      {sections.length===0 ? <EmptyState title="No visible settings" description="No visible settings match the selected filters."/> : null}
      <nav
        aria-label="Settings sections"
        className="flex min-w-0 gap-2 overflow-x-auto border-b border-border pb-1"
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-[3px] border-transparent px-3 text-sm font-semibold text-[var(--lms-neutral-400)] transition-colors duration-150 hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary)] focus-visible:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
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
              className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-xl)] leading-[30px] min-[768px]:text-[22px] min-[768px]:leading-[32px] min-[992px]:text-[var(--lms-font-3xl)] min-[992px]:leading-[40px]"
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
