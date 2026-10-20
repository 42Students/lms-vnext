import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import {TpoBuiltinJobTypesEditor} from "@/components/tpo/tpo-builtin-job-types-editor";
import { TpoJobTypesEditor } from "@/components/tpo/tpo-job-types-editor";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { getTpoJobTypes } from "@/modules/placements/tpo-configuration-read-service";
export const dynamic="force-dynamic";
export default async function JobTypesSettings(){
 const {ready,rows}=await getTpoJobTypes(await getCurrentRequestContext());
 return <div className="min-w-0 space-y-4"><TpoSettingsNav active="job-types"/><PageHeader title="Job types" />
 <p className="text-sm text-muted-foreground">Manage the college&apos;s custom job-type choices. Inactive types are kept for historical records.</p>
 {ready?<TpoBuiltinJobTypesEditor stored={rows.map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))}
  customActive={rows.filter(row=>!row.isBuiltin&&row.active).length}/>:null}
 {!ready?<Alert tone="warning">Job types storage is awaiting migration registration.</Alert>:
 <TpoJobTypesEditor types={rows.filter(row=>!row.isBuiltin).map(row=>({...row,updatedAt:row.updatedAt.toISOString()}))}/>}
 </div>;
}