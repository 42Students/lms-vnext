/** Exact DriveSubNav copy from lms-dev-2026 / legacy-copy-A.md. */
export const COLLEGE_LEGACY_DRIVE_TABS = [
  {label:"Overview",segment:"overview"},
  {label:"Applications",segment:"applications"},
  {label:"Schedule",segment:"interviews"},
  {label:"Settings",segment:"settings"},
] as const;
export function collegeDriveDetailTabs(jobId:string){
  const base="/college/placements/jobs/"+encodeURIComponent(jobId);
  return COLLEGE_LEGACY_DRIVE_TABS.map(tab=>({
    label:tab.label,href:base+"/"+tab.segment,
  }));
}
export function collegeDriveTabActive(pathname:string,href:string){
  return pathname===href||pathname.startsWith(href+"/");
}
