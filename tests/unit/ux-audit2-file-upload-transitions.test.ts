import { describe, expect, it } from "vitest";
import { mustClearFileSelection } from "@/components/ui/file-upload";

describe("RV-03 C-08 picker selected-file invalidation",()=>{
  it("clears a valid selection on unavailable or disabled, not while available",()=>{
    expect(mustClearFileSelection(true,false,false)).toBe(false);
    expect(mustClearFileSelection(true,true,false)).toBe(true);
    expect(mustClearFileSelection(true,false,true)).toBe(true);
  });
  it("re-enabling never restores stale parent selection after clearing",()=>{
    let selected=true;
    if(mustClearFileSelection(selected,true,false)) selected=false;
    // Parent onFiles(null) follows this transition; re-enable cannot resurrect FileList.
    expect(selected).toBe(false);
    expect(mustClearFileSelection(selected,false,false)).toBe(false);
    // Explicitly choosing a new file is the only way to select again.
    selected=true;
    expect(mustClearFileSelection(selected,false,false)).toBe(false);
  });
});
