import test from "node:test";
import assert from "node:assert/strict";
import {canonicalPgTypeLabel} from "../scripts/db020-sql-type.mjs";

test("DB020 PostgreSQL character varying and Drizzle varchar are exact type aliases",()=>{
  for(const n of [1,16,64,120,255,1024]) {
    assert.equal(canonicalPgTypeLabel(`character varying(${n})`),
      canonicalPgTypeLabel(`varchar(${n})`));
  }
});
test("DB020 type comparison preserves material type and length differences",()=>{
  for(const [a,b] of [
    ["character varying(120)","varchar(121)"],
    ["character varying(64)","text"],
    ["timestamp with time zone","timestamp without time zone"],
    ["numeric(10,2)","numeric(10,3)"],
    ["varchar(30)[]","varchar(30)"],
  ]) assert.notEqual(canonicalPgTypeLabel(a),canonicalPgTypeLabel(b));
});

test("DB020 safe timestamp and decimal formatting aliases do not hide precision",()=>{
 assert.equal(canonicalPgTypeLabel("timestamp without time zone"),
   canonicalPgTypeLabel("timestamp"));
 assert.equal(canonicalPgTypeLabel("numeric(12,4)"),
   canonicalPgTypeLabel("numeric(12, 4)"));
 assert.notEqual(canonicalPgTypeLabel("numeric(12,4)"),
   canonicalPgTypeLabel("numeric(12, 3)"));
 assert.notEqual(canonicalPgTypeLabel("timestamp with time zone"),
   canonicalPgTypeLabel("timestamp"));
 // SERIAL is an identity/default contract, not a SQL column type alias.
 assert.notEqual(canonicalPgTypeLabel("bigint"),
   canonicalPgTypeLabel("bigserial"));
});
