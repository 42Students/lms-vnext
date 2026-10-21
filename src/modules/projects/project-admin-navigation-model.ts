/** One source for the legacy Projects tab order and default workspace route.
 * New vNext college workspaces intentionally render directly at /college/projects,
 * eliminating the old redirect-only page and avoiding a duplicate navigation hop.
 */
export const PROJECT_ADMIN_SECTIONS=[
  {key:"workspaces",suffix:"",label:"Workspaces"},
  {key:"at-risk",suffix:"/at-risk",label:"At Risk"},
  {key:"readiness",suffix:"/readiness",label:"Readiness"},
  {key:"submissions",suffix:"/submissions",label:"Submissions"},
  {key:"templates",suffix:"/templates",label:"Templates"},
  {key:"audit",suffix:"/audit",label:"Audit"},
] as const;
export const projectAdminDefaultHref=(basePath:string)=>basePath+PROJECT_ADMIN_SECTIONS[0].suffix;
