import {collegeCourseCatalogueQuerySchema,type CollegeCourseCatalogueQuery} from "./college-course-catalogue-model";
import {buildCollegeDirectoryCsv} from "@/modules/academics/college-directory-export-model";

export const COLLEGE_COURSE_EXPORT_CAP=1000;
export const collegeCourseCatalogueExportQuerySchema=
 collegeCourseCatalogueQuerySchema.omit({page:true});

export function collegeCourseCatalogueExportHref(query:CollegeCourseCatalogueQuery){
 const params=new URLSearchParams();
 if(query.q)params.set("q",query.q);
 if(query.sort!=="NAME_ASC")params.set("sort",query.sort);
 return "/api/academics/college-course-export"+(params.size?"?"+params.toString():"");
}
export function renderCollegeCourseCatalogueCsv(rows:readonly {
 name:string;code:string;departmentName:string;description:string|null;status:string;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(
  ["Course","Course code","Department","Description","Status"],
  rows.map(item=>[item.name,item.code,item.departmentName,item.description??"",item.status]),
  truncated,COLLEGE_COURSE_EXPORT_CAP,
 );
}
