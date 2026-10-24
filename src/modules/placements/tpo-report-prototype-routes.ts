/** Prototype report labels are stable, but some old slugs were retired.
 * Resolve before producing a clickable card; never surface a missing route. */
export function tpoPrototypeReportRoute(path:string):string{
 switch(path){
  case "/tpo/reports/outcomes":return "/tpo/reports/after-college";
  case "/tpo/reports/recruiter-leads":return "/tpo/reports/leads";
  default:return path;
 }
}
