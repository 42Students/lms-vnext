/** TPO-campaigns-public-32: allow first toggle with a live consented cohort. */
export function publicPlacementSettingState(
 value:{ready:false}|{ready:true;settings:{enabled:boolean;populationCount:number|null}|null;populationCount?:number},
):{label:string;canEnable:boolean;enabled:boolean;populationCount:number|null}{
 if(!value.ready)return {label:"Public placement storage is unavailable.",canEnable:false,enabled:false,populationCount:null};
 const enabled=value.settings?.enabled??false;
 const population=value.populationCount??value.settings?.populationCount??0;
 const canEnable=Number.isSafeInteger(population)&&population>=5;
 return {
  label:enabled?"Public placement statistics are enabled.":
   canEnable?"Public placement statistics are disabled.":
   "Public placement statistics cannot be enabled until at least five active learners have consented in an invited batch.",
  canEnable,enabled,populationCount:population,
 };
}
