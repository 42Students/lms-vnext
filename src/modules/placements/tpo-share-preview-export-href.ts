export function tpoFilteredSharePreviewExportHref(jobId:string,search:string){
 const base="/api/placements/jobs/"+encodeURIComponent(jobId)+"/share-preview/export";
 return search?base+"?"+new URLSearchParams({q:search}):base;
}
