/** Import-only projection of legacy ProjectTemplateDTO.
 * UUID identifiers and persisted memberships govern access in vNext; legacy
 * numeric IDs, course labels, creator type and phase are display provenance.
 */
export type LegacyProjectTemplateDto={
 id:number|null;slug:string;title:string;summary:string|null;
 courseLabel:string|null;phase:string|null;status:string;
 version:number;createdAt:string|null;updatedAt:string|null;
 publishedAt:string|null;organizationId:number|null;
 collegeId:number|null;createdById:number|null;
};
export function projectTemplateLegacyDto(input:{
 legacyId?:number|null;slug:string;title:string;summary:string|null;
 legacyCourseLabel:string|null;legacyPhase:string|null;
 status:string;currentVersion:number;createdAt:Date;
 updatedAt:Date;publishedAt?:Date|null;legacyOrganizationId?:number|null;
 legacyCollegeId?:number|null;legacyCreatedById?:number|null;
}):LegacyProjectTemplateDto {
 return {
  id:input.legacyId??null,
  slug:input.slug,title:input.title,summary:input.summary,
  courseLabel:input.legacyCourseLabel,phase:input.legacyPhase,
  status:input.status,version:input.currentVersion,
  createdAt:Number.isFinite(input.createdAt.getTime())?input.createdAt.toISOString():null,
  updatedAt:Number.isFinite(input.updatedAt.getTime())?input.updatedAt.toISOString():null,
  publishedAt:input.publishedAt&&Number.isFinite(input.publishedAt.getTime())
    ?input.publishedAt.toISOString():null,
  organizationId:input.legacyOrganizationId??null,
  collegeId:input.legacyCollegeId??null,
  createdById:input.legacyCreatedById??null,
 };
}
