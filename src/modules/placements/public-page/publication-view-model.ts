export function publicPlacementSettingState(
  value: {ready:false} | {ready:true;settings:{enabled:boolean;populationCount:number|null}|null},
): {label:string;canEnable:boolean;enabled:boolean} {
  if(!value.ready)return {label:"Public placement storage is unavailable.",canEnable:false,enabled:false};
  if(!value.settings)return {label:"The public placement cohort is not configured.",canEnable:false,enabled:false};
  return {
    label:value.settings.enabled?"Public placement statistics are enabled.":"Public placement statistics are disabled.",
    enabled:value.settings.enabled,
    canEnable:Number.isSafeInteger(value.settings.populationCount) &&
      (value.settings.populationCount??0)>=5,
  };
}
