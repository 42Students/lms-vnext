import type {HrDriveDraft} from "./hr-drive-draft-model";
export const HR_DRIVE_ROUND_PRESETS=[
 {id:"INTERVIEW_ONLY",label:"Test, Technical, HR",rounds:[{kind:"TEST",name:"Aptitude test"},{kind:"INTERVIEW",name:"Technical interview"},{kind:"INTERVIEW",name:"HR interview"}]},
 {id:"TEST_INTERVIEW",label:"Talk, Test, Interview",rounds:[
  {kind:"TALK",name:"Company talk"},{kind:"TEST",name:"Online test"},{kind:"INTERVIEW",name:"Interview"}]},
 {id:"FULL_PROCESS",label:"Test, Group discussion, Interview",rounds:[
  {kind:"TEST",name:"Online test"},{kind:"GD",name:"Group discussion"},{kind:"INTERVIEW",name:"Interview"}]},
] as const;
export type HrRoundPresetId=(typeof HR_DRIVE_ROUND_PRESETS)[number]["id"];
export function applyHrRoundPreset(draft:HrDriveDraft,id:HrRoundPresetId):HrDriveDraft {
 const selected=HR_DRIVE_ROUND_PRESETS.find(p=>p.id===id);
 if(!selected)return draft;
 return {...draft,rounds:selected.rounds.map(r=>({...r}))};
}
