/** SA-tenants-modules-R01: a visible scope must be explicit on every control page. */
export function adminControlScopeTag(scope:{collegeId?:string|null;organizationId?:string|null}|null|undefined){
 return scope?.collegeId?"One college":scope?.organizationId?"Organization scope":"Platform view";
}
export function adminControlFeatureCounts(
 rows:readonly {modules:readonly {module:string;enabled:boolean}[]}[],
){
 return {
  projectsOn:rows.filter(row=>row.modules.some(x=>x.module==="projects"&&x.enabled)).length,
  placementsOn:rows.filter(row=>row.modules.some(x=>x.module==="placements"&&x.enabled)).length,
  shown:rows.length,
 };
}
