import {z} from "zod";

export const collegeCourseCatalogueQuerySchema=z.object({
 q:z.string().trim().max(100).default(""),
 sort:z.enum(["NAME_ASC","NAME_DESC","CODE_ASC","CODE_DESC"]).default("NAME_ASC"),
 page:z.coerce.number().int().min(1).max(1000).default(1),
 pageSize:z.enum(["10","25","50","100"]).optional(),
}).strict();
export type CollegeCourseCatalogueQuery=z.infer<typeof collegeCourseCatalogueQuerySchema>;
export const COLLEGE_COURSE_CATALOGUE_PAGE_SIZE=25;

export function collegeCourseCatalogueHref(query:CollegeCourseCatalogueQuery){
 const params=new URLSearchParams();
 if(query.q)params.set("q",query.q);
 if(query.sort!=="NAME_ASC")params.set("sort",query.sort);
 if(query.page>1)params.set("page",String(query.page));
 if(query.pageSize&&query.pageSize!=="25")params.set("pageSize",query.pageSize);
 return "/college/courses"+(params.size?"?"+params.toString():"");
}

export function paginateCollegeCourses<T extends {id:string;name:string;code:string;departmentName:string}>(
 courses:readonly T[],query:CollegeCourseCatalogueQuery,
){
 const term=query.q.toLocaleLowerCase();
 const filtered=courses.filter(course=>!term||
  [course.name,course.code,course.departmentName].some(value=>value.toLocaleLowerCase().includes(term)));
 const sorted=[...filtered].sort((a,b)=>{
  const field=query.sort.startsWith("CODE")?"code":"name";
  const sign=query.sort.endsWith("DESC")?-1:1;
  return sign*a[field].localeCompare(b[field])||a.id.localeCompare(b.id);
 });
 const pageSize=Number(query.pageSize??COLLEGE_COURSE_CATALOGUE_PAGE_SIZE);
 const pages=Math.max(1,Math.ceil(sorted.length/pageSize));
 const page=Math.min(query.page,pages);
 return {items:sorted.slice((page-1)*pageSize,
  page*pageSize),total:sorted.length,pages,page,pageSize};
}
