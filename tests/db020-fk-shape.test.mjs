import {test} from "node:test";
import assert from "node:assert/strict";
import {compareForeignKeyShapes,foreignKeyShape} from "../scripts/db020-fk-shape.mjs";

const base={
 child:"activity_events",parent:"college_memberships",
 columnsFrom:["actor_membership_id","college_id"],
 columnsTo:["id","college_id"],onDelete:"restrict",onUpdate:"no action",
};
test("DB020 identical FK relationship with renamed constraint is not misreported as missing",()=>{
 const a={...base,name:"typed_scope"};
 const b={...base,name:"catalog_scope"};
 const r=compareForeignKeyShapes([a],[b]);
 assert.equal(r.exactSameShapeCount,1);
 assert.equal(r.differentNameSameShape.length,1);
 assert.equal(r.missingTypedShape.length,0);
 assert.equal(r.catalogShapeWithoutTyped.length,0);
});
test("DB020 ordered columns, parent relation and referential action are security significant",()=>{
 const a={...base,name:"typed_scope"};
 for(const b of [
  {...base,name:"catalog_scope",columnsFrom:[...base.columnsFrom].reverse()},
  {...base,name:"catalog_scope",parent:"users"},
  {...base,name:"catalog_scope",onDelete:"cascade"},
  {...base,name:"catalog_scope",columnsTo:[...base.columnsTo].reverse()},
 ]){
  const r=compareForeignKeyShapes([a],[b]);
  assert.equal(r.exactSameShapeCount,0);
  assert.equal(r.missingTypedShape.length,1);
  assert.equal(r.catalogShapeWithoutTyped.length,1);
 }
});
test("DB020 same constraint name with different relationship shape is rejected",()=>{
 const a={...base,name:"scope"};
 const b={...base,name:"scope",onDelete:"cascade"};
 const r=compareForeignKeyShapes([a],[b]);
 assert.equal(r.sameNameDrift.length,1);
 assert.equal(r.exactSameShapeCount,0);
});
test("DB020 canonical public-qualified and unqualified parent names match",()=>{
 const a={...base,name:"type"};
 const b={...base,name:"catalog",parent:"public.college_memberships"};
 assert.equal(foreignKeyShape(a),foreignKeyShape(b));
});
