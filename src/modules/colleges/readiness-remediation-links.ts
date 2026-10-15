import type {CollegeReadinessCheckId} from "./readiness-model";
const routes:Record<CollegeReadinessCheckId,string>={
 COLLEGE_ACTIVE:"/admin/tenants",
 COLLEGE_ADMIN:"/admin/people",
 DEPARTMENTS:"/admin/departments",
 PROGRAMS:"/admin/programs",
 COHORTS:"/admin/batches",
 LEARNERS:"/admin/students",
 FACULTY:"/admin/faculty",
 TPO:"/admin/people",
 PLACEMENT_SEASON:"/admin/placements",
 TENANT_DOMAIN:"/admin/domains",
};
export function readinessRemediationLink(id:CollegeReadinessCheckId,collegeId:string){
 return id==="TENANT_DOMAIN"?"/admin/colleges/"+encodeURIComponent(collegeId)+"/subdomain":routes[id];
}
