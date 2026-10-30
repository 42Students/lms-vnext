import {test} from "node:test";
import assert from "node:assert/strict";
import {compareForeignKeyShapes,foreignKeyShape,partitionCatalogOnlyForeignKeys} from "../scripts/db020-fk-shape.mjs";

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
test("DB020 nondeferrable NO ACTION remains distinct from RESTRICT in exact catalog comparison",()=>{
 const a={...base,name:"owned",onDelete:"no action"};
 const b={...base,name:"owned",onDelete:"restrict"};
 const r=compareForeignKeyShapes([a],[b]);
 assert.equal(r.sameNameDrift.length,1);
 assert.equal(r.exactSameShapeCount,0);
});

test("DB020 canonical public-qualified and unqualified parent names match",()=>{
 const a={...base,name:"type"};
 const b={...base,name:"catalog",parent:"public.college_memberships"};
 assert.equal(foreignKeyShape(a),foreignKeyShape(b));
});

test("DB020 prioritizes structurally identical renamed FK over misleading same-name drift",()=>{
 const target={...base,name:"typed_scope"};
 const stale={...base,name:"typed_scope",onDelete:"cascade"};
 const equivalent={...base,name:"other_catalog_name"};
 const result=compareForeignKeyShapes([target],[stale,equivalent]);
 assert.equal(result.exactSameShapeCount,1);
 assert.equal(result.sameNameDrift.length,0);
 assert.equal(result.differentNameSameShape.length,1);
 assert.deepEqual(result.catalogShapeWithoutTyped,[stale]);
 assert.equal(result.missingTypedShape.length,0);
});

test("DB020 pairing is not affected by typed declaration order when names overlap",()=>{
 const a={...base,name:"a"};
 const b={...base,name:"b",onDelete:"cascade"};
 const result=compareForeignKeyShapes([b,a],[a,b]);
 assert.equal(result.sameNameSameShape.length,2);
 assert.equal(result.exactSameShapeCount,2);
 assert.equal(result.sameNameDrift.length,0);
 assert.equal(result.catalogShapeWithoutTyped.length,0);
});

test("DB020 duplicate typed relationship cannot reuse one catalog FK",()=>{
 const a={...base,name:"typed_one"};
 const b={...base,name:"typed_two"};
 const c={...base,name:"catalog_only"};
 const result=compareForeignKeyShapes([a,b],[c]);
 assert.equal(result.exactSameShapeCount,1);
 assert.equal(result.missingTypedShape.length,1);
 assert.equal(result.catalogShapeWithoutTyped.length,0);
});

test("DB020 keeps SQL-only live FK constraints visible but separate from typed schema gaps",()=>{
 const typed={...base,child:"typed_child",name:"typed_fk"};
 const sourceOnly={...base,child:"sql_only_child",name:"sql_only_fk"};
 const classified=partitionCatalogOnlyForeignKeys(
   [sourceOnly,typed],["public.typed_child"]);
 assert.deepEqual(classified.sqlOnlyTableEdges,[sourceOnly]);
 assert.deepEqual(classified.typedTableEdges,[typed]);
 assert.equal(classified.sqlOnlyTableEdges.length+classified.typedTableEdges.length,2);
});
