import {it,expect} from "vitest";
import { summarizeTpoBatchStates } from "@/modules/placements/tpo-batch-kpi-model";
it("uses persisted lifecycle state and does not invent learner eligibility",()=>{
 const base={name:"a",program:"p",department:"d",code:"1",invitedAt:null,finishedAt:null};
 expect(summarizeTpoBatchStates([base,{...base,invitedAt:new Date()},{...base,finishedAt:new Date()}]))
 .toEqual({total:3,planning:1,invited:1,finished:1});
});