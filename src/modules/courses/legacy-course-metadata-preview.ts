/** Only the 14 public display fields from legacy MetaData.java, which uses
 * Jackson LowerCaseWithUnderscoresStrategy, may cross the admin read boundary.
 * The raw JSON can also hold private upload receipts; never send it to React.
 * Preserve absence and explicit null separately and never parse legacy date
 * strings as UTC or treat the display-only course_code as an ACL identifier.
 */
export const LEGACY_COURSE_METADATA_FIELDS = [
 {key:"amount",alternate:"amount",target:"courses.legacyPriceInr"},
 {key:"image_url",alternate:"imageUrl",target:"courses.imageUrl"},
 {key:"takeaways",alternate:"takeaways",target:"courseDisplayContents.takeaways / courses.orderedTakeaways"},
 {key:"course_code",alternate:"courseCode",target:"courses.legacyMetadata.courseCode (not courses.code)"},
 {key:"course_type",alternate:"courseType",target:"courses.legacyCourseType"},
 {key:"course_color",alternate:"courseColor",target:"courses.cardColor"},
 {key:"image_url_lp",alternate:"imageUrlLp",target:"courses.imageUrlLearningPath"},
 {key:"course_category",alternate:"courseCategory",target:"courses.legacyCategory"},
 {key:"course_end_date",alternate:"courseEndDate",target:"courses.legacyCourseEndDateText"},
 {key:"course_start_date",alternate:"courseStartDate",target:"courses.legacyCourseStartDateText"},
 {key:"introduction_content",alternate:"introduction_content",target:"courses.legacyIntroductionHtml"},
 {key:"html_content",alternate:"htmlContent",target:"courseDisplayContents.bodyHtml"},
 {key:"updated_on",alternate:"updatedOn",target:"courses.legacyMetadata.updatedOn (raw date string)"},
 {key:"thumbnail",alternate:"thumbnail",target:"courseDisplayContents.thumbnailUrl / courses.thumbnailUrl"},
] as const;

export type LegacyCourseMetadataField={
 key:(typeof LEGACY_COURSE_METADATA_FIELDS)[number]["key"];
 target:string;
 status:"MISSING"|"NULL"|"VALUE";
 value:string|null;
};

function preview(key:string,raw:unknown):string {
 if(key==="takeaways"){
  return Array.isArray(raw)&&raw.every(item=>typeof item==="string")
   ?raw.map(item=>(item as string).slice(0,300)).join(" · ").slice(0,1000)
   :"Unrecognized legacy list";
 }
 if(key==="amount"){
  return typeof raw==="number"&&Number.isSafeInteger(raw)&&raw>=0
   ?String(raw):"Unrecognized amount";
 }
 if(typeof raw!=="string")return "Unrecognized legacy value";
 if(["image_url","image_url_lp","thumbnail"].includes(key)&&raw.trim()){
  try{
   const url=new URL(raw);
   if(!["http:","https:"].includes(url.protocol)||url.username||url.password)
    return "Unsafe legacy image link (not displayed)";
  }catch{return "Invalid legacy image link (not displayed)";}
 }
 if(key==="course_color"&&raw.trim()&&!/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(raw.trim()))
  return "Invalid legacy color (not applied)";
 // JSX renders this as escaped TEXT. The historical HTML must not become
 // dangerouslySetInnerHTML merely because it was once displayed as rich text.
 return raw.slice(0,1000);
}

export function legacyCourseMetadataPreview(
 raw:Record<string,unknown>|null|undefined,
):LegacyCourseMetadataField[]{
 return LEGACY_COURSE_METADATA_FIELDS.map((spec):LegacyCourseMetadataField=>{
  const exists=Boolean(raw)&&(
   Object.prototype.hasOwnProperty.call(raw,spec.key)||
   Object.prototype.hasOwnProperty.call(raw,spec.alternate));
  if(!exists)return {key:spec.key,target:spec.target,status:"MISSING",value:null};
  const value=Object.prototype.hasOwnProperty.call(raw,spec.key)
   ?raw?.[spec.key]:raw?.[spec.alternate];
  if(value===null)return {key:spec.key,target:spec.target,status:"NULL",value:null};
  return {key:spec.key,target:spec.target,status:"VALUE",value:preview(spec.key,value)};
 });
}
