import test from "node:test";
import assert from "node:assert/strict";
import {validateTarget,parseTap,assertPass,runWitnesses,WITNESSES,CONSENT} from "../scripts/db-staged-pg-witnesses.mjs";

const local="postgresql://tester:demo@127.0.0.1:5432/lms_vnext_test";
const base=()=>({TEST_DATABASE_URL:local,DB_STAGED_WITNESSES:CONSENT});
const denied=(env,reason)=>assert.ok(validateTarget(env).errors.some(e=>e.includes(reason)),
  JSON.stringify(validateTarget(env)));

test("five isolated staged PG witnesses are enumerated",()=>{
  assert.equal(WITNESSES.length,5);
  assert.equal(new Set(WITNESSES.map(x=>x[0])).size,5);
  assert.ok(WITNESSES.every(x=>x[0].startsWith("tests/")&&x[0].endsWith("-pg.test.mjs")));
});
test("no implicit target is permitted",()=>denied({DB_STAGED_WITNESSES:CONSENT},"required"));
test("malformed TEST_DATABASE_URL cannot be used",()=>denied({...base(),TEST_DATABASE_URL:"%" },"Invalid"));
test("non-PostgreSQL URLs cannot be used",()=>denied({...base(),TEST_DATABASE_URL:"mysql://x@localhost/lms_test"},"PostgreSQL"));
test("valuable postgres system database is rejected",()=>denied({...base(),TEST_DATABASE_URL:"postgresql://x@localhost/postgres"},"Disposable"));
test("non-test db name is rejected even at localhost",()=>denied({...base(),TEST_DATABASE_URL:"postgresql://x@localhost/lms_vnext"},"Disposable"));
test("URL without user is rejected",()=>denied({...base(),TEST_DATABASE_URL:"postgresql://localhost/lms_test"},"user"));
test("redirectable query parameters are rejected",()=>denied({...base(),TEST_DATABASE_URL:local+"?host=prod"},"parameters"));
test("a production DATABASE_URL on exactly the same DB is rejected",()=>denied({...base(),DATABASE_URL:local},"Same"));
test("percent-encoded database alias cannot bypass same-target protection",()=>{
  denied({...base(),
    TEST_DATABASE_URL:"postgresql://tester:demo@localhost:5432/lms_vnext_%74est",
    DATABASE_URL:local
  },"Same");
});
test("URL-encoded slash cannot disguise a destructive noncanonical database name",()=>{
  denied({...base(),
    TEST_DATABASE_URL:"postgresql://tester:demo@localhost/lms_test_shadow%2Finternal",
  },"Canonical disposable target refused");
});
test("disposable name is subject to the canonical test naming policy",()=>{
  denied({...base(),
    TEST_DATABASE_URL:"postgresql://tester:demo@localhost/lms_disposable",
  },"Canonical disposable target refused");
});
test("canonical guard accepts a normal explicitly isolated witness",()=>{
  assert.equal(validateTarget(base()).safe,true);
});
test("loopback aliases and differing passwords do not bypass same-db denial",()=>denied({...base(),DATABASE_URL:"postgresql://different:password@localhost:5432/lms_vnext_test"},"Same"));
test("missing explicit destructive-temp-schema consent is rejected",()=>denied({...base(),DB_STAGED_WITNESSES:undefined},"opt-in"));
test("remote database needs explicit second opt-in",()=>denied({...base(),TEST_DATABASE_URL:"postgresql://x@pg.example.net/lms_vnext_test"},"remote"));
test("remote database needs exact host/port/name confirmation",()=>denied({...base(),TEST_DATABASE_URL:"postgresql://x@pg.example.net/lms_vnext_test",ALLOW_REMOTE_TEST_WITNESS:"true"},"confirmation"));
test("remote database with exact confirmation and opted-in test name is allowed",()=>{
  assert.equal(validateTarget({...base(),TEST_DATABASE_URL:"postgresql://x@pg.example.net:5433/lms_test",ALLOW_REMOTE_TEST_WITNESS:"true",DB_WITNESS_REMOTE_CONFIRM:"DISPOSABLE:pg.example.net:5433/lms_test"}).safe,true);
});
test("non-default remote witness confirmation is port-bound at the shared guard",()=>{
  const env={...base(),TEST_DATABASE_URL:"postgresql://x@pg.example.net:5433/lms_test",
    ALLOW_REMOTE_TEST_WITNESS:"true",DB_WITNESS_REMOTE_CONFIRM:"DISPOSABLE:pg.example.net:5433/lms_test"};
  assert.equal(validateTarget(env).safe,true,JSON.stringify(validateTarget(env).errors));
  denied({...env,DB_WITNESS_REMOTE_CONFIRM:"DISPOSABLE:pg.example.net:5432/lms_test"},"confirmation");
});
test("safe local disposable target accepts explicit authorization",()=>assert.equal(validateTarget(base()).safe,true));
test("success TAP requires a real positive test count",()=>{
  assert.equal(assertPass(0,"# tests 2\n# pass 2\n# fail 0\n# skipped 0\n# cancelled 0\n").pass,2);
  assert.equal(parseTap("# tests 2\n# pass 2\n# fail 0\n# skipped 0\n# cancelled 0\n").tests,2);
});
test("passing zero or absent results is never database evidence",()=>{
  assert.throws(()=>assertPass(0,"# tests 0\n# pass 0\n# fail 0\n# skipped 0\n# cancelled 0\n"));
  assert.throws(()=>assertPass(0,"garbage"));
});
test("skipped tests cannot be mistaken for passing PG acceptance",()=>{
  assert.throws(()=>assertPass(0,"# tests 1\n# pass 0\n# fail 0\n# skipped 1\n# cancelled 0\n"));
});
test("nonzero child exit even with optimistic TAP is rejected",()=>{
  assert.throws(()=>assertPass(1,"# tests 1\n# pass 1\n# fail 0\n# skipped 0\n# cancelled 0\n"));
});
test("all five witnesses receive independent opt-in but never application DB URL",()=>{
  const witnessed=[];
  const fake=(bin,args,opts)=>{
    witnessed.push({bin,args,env:opts.env,cwd:opts.cwd});
    return {status:0,stdout:"# tests 1\n# pass 1\n# fail 0\n# skipped 0\n# cancelled 0\n",stderr:""};
  };
  const report=runWitnesses({...base(),DATABASE_URL:"postgresql://app:pw@localhost/lms_vnext"},fake);
  assert.equal(report.results.length,5);
  assert.equal(report.verification,"STAGED_DISPOSABLE_POSTGRES_ONLY_NOT_MIGRATION_REPLAY");
  assert.equal(witnessed.length,5);
  for(let i=0;i<WITNESSES.length;i++){
    const x=witnessed[i];
    assert.equal(x.args[0],"--test");assert.equal(x.args[1],WITNESSES[i][0]);
    assert.equal(x.env[WITNESSES[i][1]],CONSENT);
    assert.equal(x.env.DATABASE_URL,undefined);
    assert.equal(x.env.TEST_DATABASE_URL,local);
    assert.equal(x.env.ALLOW_DB_RESET,undefined);
    for(let j=0;j<WITNESSES.length;j++)if(i!==j)assert.equal(x.env[WITNESSES[j][1]],undefined);
  }
});
test("a skipped witness aborts the batch at the first failure",()=>{
  let runs=0;
  const fake=()=>{runs++;return {status:0,stdout:"# tests 1\n# pass 0\n# fail 0\n# skipped 1\n# cancelled 0\n",stderr:""}};
  assert.throws(()=>runWitnesses(base(),fake),/skipped/);
  assert.equal(runs,1);
});
test("unsafe target prevents any child invocation",()=>{
  let runs=0;assert.throws(()=>runWitnesses({...base(),TEST_DATABASE_URL:"postgresql://x@localhost/production"},()=>{runs++;return {status:0}}));
  assert.equal(runs,0);
});
