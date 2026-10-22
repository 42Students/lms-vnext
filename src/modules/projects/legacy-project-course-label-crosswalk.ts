/** Historical project DTO metadata is display-only; project membership and
 * creation authority still derive from persisted college-scoped memberships.
 */
export const LEGACY_PROJECT_DETAIL_DTO_CROSSWALK=[
 {source:"courseLabel",destination:"offering course title snapshot",fallback:null},
 {source:"phase",destination:"release and current sprint display title",fallback:null},
 {source:"createdBy",destination:"actor membership and audit snapshot",fallback:null},
 {source:"isPublished",destination:"project release publication state",fallback:false},
 {source:"publishedAt",destination:"release published_at timestamptz",fallback:null},
 {source:"status",destination:"project_instances.status (not risk state)",fallback:"UNKNOWN"},
] as const;
export function legacyProjectDetailsDisplay(input:{
 courseLabel?:string|null;phase?:string|null;
 createdBy?:string|null;isPublished?:boolean|null;
 publishedAt?:string|null;status?:string|null;
}){
 return {courseLabel:input.courseLabel?.trim()||null,
  phase:input.phase?.trim()||null,
  createdBy:input.createdBy?.trim()||null,
  isPublished:input.isPublished===true,
  publishedAt:input.publishedAt&&Number.isFinite(Date.parse(input.publishedAt))
   ?new Date(input.publishedAt).toISOString():null,
  status:input.status?.trim()||"UNKNOWN"};
}
