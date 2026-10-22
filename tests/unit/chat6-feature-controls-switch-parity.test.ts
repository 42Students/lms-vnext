import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  collegeRulePayload, collegeRuleSelection, isCollegeRuleDirty,
} from "@/modules/module-access/admin-college-rule-ui-model";

describe("legacy college feature switch with vNext inheritance safety", () => {
  it("keeps inherited effective access distinct from an explicit stored ON/OFF override", () => {
    expect(collegeRuleSelection(null)).toBe("INHERIT");
    expect(collegeRuleSelection({enabled:true,locked:false})).toBe("ON");
    expect(collegeRuleSelection({enabled:false,locked:false})).toBe("OFF");
    expect(isCollegeRuleDirty("OFF",false,null)).toBe(true);
    expect(collegeRulePayload("placements","OFF",false,null)).toMatchObject({
      action:"SET",enabled:false,expected:null,
    });
  });

  it("renders the effective inherited state, retains the lock gate and requires review", () => {
    const source=readFileSync("src/components/admin/college-feature-rule-editor.tsx","utf8");
    const page=readFileSync("src/app/(authenticated)/admin/features/page.tsx","utf8");
    expect(source).toContain('label={moduleLabel+" for "+collegeLabel}');
    expect(source).toContain('checked={choice==="INHERIT"?effectiveEnabled:choice==="ON"}');
    expect(source).toContain('disabled={busy||impactBusy||confirm||ancestorLocked}');
    expect(source).toContain('setChoice(event.target.checked?"ON":"OFF")');
    expect(source).toContain("Not saved — review policy change");
    expect(source).toContain("const latest=parseCollegeRuleRecheck(ruleData,module)");
    expect(source).toContain("setConfirm(true)");
    expect(page).toContain("effectiveEnabled={decision.enabled} collegeLabel={college.name}");
  });
});
