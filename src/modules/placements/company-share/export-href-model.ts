export function publicApplicantExportHref(token:string,search:string){
 const base="/api/placements/company-share/"+encodeURIComponent(token)+"/export";
 return search?base+"?"+new URLSearchParams({q:search}):base;
}
