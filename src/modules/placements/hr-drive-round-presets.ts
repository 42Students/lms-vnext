import type {HrDriveDraft} from "./hr-drive-draft-model";
export const HR_DRIVE_ROUND_PRESETS=[
 {id:"INTERVIEW_ONLY",label:"Interview only",rounds:[{kind:"INTERVIEW",name:"Interview"}]},
 {id:"TEST_INTERVIEW",label:"Test + interview",rounds:[
  {kind:"TEST",name:"Aptitude test"},{kind:"INTERVIEW",name:"Technical interview"}]},
 {id:"FULL_PROCESS",label:"Full process",rounds:[
  {kind:"TALK",name:"Pre-placement talk"},{kind:"TEST",name:"Assessment"},
  {kind:"GD",name:"Group discussion"},{kind:"INTERVIEW",name:"Final interview"}]},
] as const;
export type HrRoundPresetId=(typeof HR_DRIVE_ROUND_PRESETS)[number]["id"];
export function applyHrRoundPreset(draft:HrDriveDraft,id:HrRoundPresetId):HrDriveDraft {
 const selected=HR_DRIVE_ROUND_PRESETS.find(p=>p.id===id);
 if(!selected)return draft;
 return {...draft,rounds:selected.rounds.map(r=>({...r}))};
}
