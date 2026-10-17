/** TPO-drives-39: legacy round templates; no schedule/room is fabricated here. */
export const TPO_DRIVE_ROUND_PRESETS = {
  NONE: {label:"Add rounds later", rounds:[]},
  TALK_TEST_INTERVIEW: {label:"Talk, Test, Interview", rounds:[
    {kind:"TALK",name:"Talk"},
    {kind:"TEST",name:"Test"},
    {kind:"INTERVIEW",name:"Interview"},
  ]},
  TEST_TECHNICAL_HR: {label:"Test, Technical, HR", rounds:[
    {kind:"TEST",name:"Test"},
    {kind:"INTERVIEW",name:"Technical"},
    {kind:"INTERVIEW",name:"HR"},
  ]},
  TEST_GD_INTERVIEW: {label:"Test, GD, Interview", rounds:[
    {kind:"TEST",name:"Test"},
    {kind:"GD",name:"GD"},
    {kind:"INTERVIEW",name:"Interview"},
  ]},
} as const;
export type TpoRoundPresetKey=keyof typeof TPO_DRIVE_ROUND_PRESETS;
export function isTpoRoundPresetKey(raw:unknown):raw is TpoRoundPresetKey{
 return typeof raw==="string"&&Object.prototype.hasOwnProperty.call(TPO_DRIVE_ROUND_PRESETS,raw);
}
export function plannedTpoRoundRows(key:TpoRoundPresetKey){
 return TPO_DRIVE_ROUND_PRESETS[key].rounds.map((row,index)=>({
  kind:row.kind,name:row.name,sequence:index+1,
 }));
}
