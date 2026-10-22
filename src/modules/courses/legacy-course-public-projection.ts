import {courseThumbnailUrlSchema} from "./validation";

/** A readonly, college-authorized projection of the old Course DTO.
 * Only fields selected by the scoped catalogue query can appear here.
 * The old mutable display code is NOT the immutable random slug.
 * Legacy amount/type/category/dates remain separate inactive metadata;
 * never fabricate these values from unrelated current fields.
 */
export type CourseProjectionSource={
 id:string;slug:string|null;name:string;shortTitle:string|null;
 code:string;departmentId:string;status:string;enabled:boolean;
 legacyAllowedForDisplay:number|null;
 description:string|null;cardColor:string|null;
 thumbnailUrl:string|null;imageUrl:string|null;imageUrlLearningPath:string|null;
 takeaways:string|null;orderedTakeaways:string[]|null;
};
function safeImage(raw:string|null):string|null{
 if(!raw)return null;
 return courseThumbnailUrlSchema.safeParse(raw).success?raw:null;
}
export function projectLegacyCoursePublic(source:CourseProjectionSource){
 return {
  id:source.id,
  slug:source.slug,
  courseName:source.name,
  shortTitle:source.shortTitle,
  active:source.status==="ACTIVE"&&source.enabled,
  deptId:source.departmentId,
  allowedForDisplay:source.legacyAllowedForDisplay!==0,
  metaData:{
   course_code:source.code,
   course_color:source.cardColor,
   image_url:safeImage(source.imageUrl),
   image_url_lp:safeImage(source.imageUrlLearningPath),
   thumbnail:safeImage(source.thumbnailUrl),
   takeaways:source.orderedTakeaways??source.takeaways?.split(/\r?\n/).map(item=>item.trim()).filter(Boolean)??[],
   introduction_content:source.description??null,
  },
 } as const;
}
