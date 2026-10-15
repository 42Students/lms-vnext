export type UploadStage="IDLE"|"SELECTED"|"UPLOADING"|"VERIFYING"|"SUCCEEDED"|"FAILED"|"CANCELLED";
export type ResourceUploadUi={stage:UploadStage;progress:number;message:string|null};
export type UploadUiEvent=
 |{type:"SELECT"}|{type:"START"}|{type:"PROGRESS";value:number}
 |{type:"TRANSFER_COMPLETE"}|{type:"VERIFIED"}|{type:"FAIL";message:string}
 |{type:"CANCEL"}|{type:"RESET"};
export const initialResourceUploadUi:ResourceUploadUi={stage:"IDLE",progress:0,message:null};
/** UI-only state machine; success is impossible without an explicit trusted verification event. */
export function transitionResourceUploadUi(state:ResourceUploadUi,event:UploadUiEvent):ResourceUploadUi{
 if(event.type==="RESET")return ["IDLE","SUCCEEDED","FAILED","CANCELLED"].includes(state.stage)?{...initialResourceUploadUi}:state;
 if(event.type==="CANCEL")return ["SELECTED","UPLOADING"].includes(state.stage)?{stage:"CANCELLED",progress:0,message:null}:state;
 if(event.type==="SELECT"&&["IDLE","FAILED","CANCELLED"].includes(state.stage))return {stage:"SELECTED",progress:0,message:null};
 if(event.type==="START"&&state.stage==="SELECTED")return {stage:"UPLOADING",progress:0,message:null};
 if(event.type==="PROGRESS"&&state.stage==="UPLOADING"&&Number.isFinite(event.value))
  return {...state,progress:Math.max(state.progress,Math.min(99,Math.max(0,Math.trunc(event.value))))};
 if(event.type==="TRANSFER_COMPLETE"&&state.stage==="UPLOADING")return {stage:"VERIFYING",progress:100,message:null};
 if(event.type==="VERIFIED"&&state.stage==="VERIFYING")return {stage:"SUCCEEDED",progress:100,message:null};
 if(event.type==="FAIL"&&["SELECTED","UPLOADING","VERIFYING"].includes(state.stage))
  return {stage:"FAILED",progress:0,message:"Upload could not be completed. Retry or choose another file."};
 return state;
}
