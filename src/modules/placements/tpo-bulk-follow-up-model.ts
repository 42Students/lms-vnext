export function tpoReviewOneByOneHref(jobId:string,applicationId:string){
 return "/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/applicants/"+encodeURIComponent(applicationId);
}
export function tpoShareWithCompanyHref(jobId:string){
 return "/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-preview";
}
