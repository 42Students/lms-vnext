import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");

test("UX-G143 faculty overview has an announced, non-eligibility progress indicator",()=>{
 const p=read("src/components/people/faculty-profile-editor.tsx");
 assert.match(p,/<progress className/);
 assert.match(p,/aria-label="Profile completeness percentage"/);
 assert.match(p,/This is not a verification or hiring-eligibility score/);
 assert.match(p,/role|Profile sections/);
});
test("UX-G143 repeated faculty records distinguish actions, expose expand/collapse state",()=>{
 const p=read("src/components/people/faculty-profile-repeatable.tsx");
 for(const word of ["aria-controls","aria-expanded", "aria-busy={pending}",
  "Duplicate ${title} record ${index+1} as draft",
  "Remove ${title} record ${index+1} from draft"]) assert.ok(p.includes(word),word);
 assert.match(p,/facultyProfileRecordHasManagedDocument/);
 assert.match(p,/!facultyProfileCanReorderVisible/);
});
test("UX-G143 faculty skills/metadata distinguish records and preserve unsaved safety",()=>{
 const s=read("src/components/people/faculty-profile-skills.tsx");
 const m=read("src/components/people/faculty-profile-metadata.tsx");
 const t=read("src/components/people/faculty-profile-text-section.tsx");
 for(const label of ["Move skill ${index+1} up","Move skill ${index+1} down","Remove skill ${index+1} from draft"]) assert.ok(s.includes(label),label);
 assert.match(m,/Remove metadata field \$\{index\+1\} from draft/);
 assert.match(m,/of 100 metadata fields/);
 assert.match(m,/facultyMetadataDraftIssue/);
 assert.match(t,/useFacultyProfileUnsavedWarning/);
 assert.match(t,/facultyProfileTextDraftIssue/);
});
test("UX-G150 learner actions and confirmation remain specific and cancellable",()=>{
 const p=read("src/components/profile/learner-profile-workspace.tsx");
 for(const token of ["promptResolverRef","promptResolverRef.current?.(false)","aria-label={\`Add ${collectionLabels[section]} record\`}",
  "Edit ${collectionLabels[section]}: ${summary.primary}",
  "Delete ${collectionLabels[section]}: ${summary.primary}",
  "Edit ${kind}: ${entry.title}",
  "Delete ${kind}: ${entry.title}"])assert.ok(p.includes(token.replaceAll("\\`","`")),token);
 for(const token of ["expectedDocument","learnerProfileCollectionMayEdit","mask","••••"]) assert.ok(p.includes(token),token);
});
