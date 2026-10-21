"use client";
import {TpoStudentNoteEditor} from "@/components/tpo/tpo-student-note-editor";
import {useTpoStudentsSelection} from "@/components/tpo/tpo-students-selection";

export function TpoStudentsSelectedNote({allowedIds}:{allowedIds:readonly string[]}){
 const selection=useTpoStudentsSelection();
 const allowed=new Set(allowedIds);
 const ids=(selection?.selected??[]).filter(id=>allowed.has(id)).slice(0,200);
 return <section aria-label="Private notes for selected students" className="space-y-2 border-t border-border pt-3">
  <p className="text-xs text-muted-foreground">Notes are saved to each learner’s placement history. Choose students in the roster above; the current selection also applies to messages, eligibility, drives and debarments.</p>
  <TpoStudentNoteEditor membershipIds={ids}/>
  {!ids.length?<p role="status" className="text-xs text-muted-foreground">Select at least one student to add a note.</p>:null}
 </section>;
}
