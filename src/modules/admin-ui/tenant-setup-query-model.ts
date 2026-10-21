import {z} from "zod";

const schema=z.strictObject({
  tab:z.enum(["STRUCTURE","LAUNCH"]).optional(),
});
export function parseSuperAdminTenantSetupQuery(
  params:Record<string,string|string[]|undefined>,
){
  if(Object.values(params).some(Array.isArray))
    return schema.safeParse(null);
  const normalized={...params};
  if(typeof normalized.tab==="string"){
    const alias:Record<string,"STRUCTURE"|"LAUNCH">={
      structure:"STRUCTURE",identity:"LAUNCH",launch:"LAUNCH",
      STRUCTURE:"STRUCTURE",LAUNCH:"LAUNCH",
    };
    normalized.tab=alias[normalized.tab]??normalized.tab;
  }
  return schema.safeParse(normalized);
}

/** Preserve historical scope-dependent default while rejecting invalid tabs. */
export function selectedSuperAdminTenantSetupTab(
  query:z.output<typeof schema>,
  collegeSelected:boolean,
):"STRUCTURE"|"LAUNCH" {
  return query.tab??(collegeSelected?"LAUNCH":"STRUCTURE");
}
