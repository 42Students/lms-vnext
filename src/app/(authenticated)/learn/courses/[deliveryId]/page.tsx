import {notFound,redirect} from "next/navigation";

/** Legacy wrapper forwards safe navigation context, not identity/tenant scope. */
export default async function LearnerCourseRedirectPage({
 params,searchParams,
}:{
 params:Promise<{deliveryId:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const {deliveryId}=await params;
 if(!deliveryId?.trim()||deliveryId.length>128||deliveryId.includes("/"))notFound();
 const provided=await searchParams;
 const filtered=new URLSearchParams();
 for(const key of ["cls","section","tab","from","review","embed"]){
  const value=provided[key];
  if(typeof value==="string"&&value.length<=160&&
    !/[\u0000-\u001f]/.test(value))filtered.set(key,value);
 }
 const suffix=filtered.size?"?"+filtered.toString():"";
 redirect("/learn/courses/"+encodeURIComponent(deliveryId)+"/home"+suffix);
}
