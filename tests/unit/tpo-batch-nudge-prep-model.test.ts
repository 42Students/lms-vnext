import {expect,it} from "vitest";
import {prepareTpoUnrecordedNudges,tpoBatchNudgeDraft} from "@/modules/placements/tpo-batch-nudge-prep-model";
const rows=[{membershipId:"1",name:"A",registration:{choice:null}},{membershipId:"2",name:"B",registration:{choice:"PLACEMENTS"}},{membershipId:"3",name:"C",registration:null}];
it("never suggests a recipient when registration storage is unavailable",()=>expect(prepareTpoUnrecordedNudges(rows,false)).toEqual([]));
it("only targets explicit no-choice rows from current authorized page",()=>{expect(prepareTpoUnrecordedNudges(rows,true).map(row=>row.membershipId)).toEqual(["1"]);expect(rows).toHaveLength(3);});
it("produces a manual note with no false delivery or consent claim",()=>expect(tpoBatchNudgeDraft("CSE 2026")).toContain("voluntary"));
