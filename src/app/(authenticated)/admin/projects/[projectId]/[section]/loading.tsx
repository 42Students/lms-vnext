"use client";
import {usePathname} from "next/navigation";
import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
import {WorkspaceReadinessLoading} from "@/components/projects/workspace-readiness-loading";

/** Keep other sections' loading state unchanged; readiness has its own
 * six-metric skeleton and still routes through server authorization. */
export default function Loading(){
 const path=usePathname();
 return path.endsWith("/readiness")
  ? <WorkspaceReadinessLoading basePath="/admin/projects"/>
  : <GracefulPageLoading label="Loading project section…" shape="directory"/>;
}
