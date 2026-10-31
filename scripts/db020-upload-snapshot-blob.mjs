#!/usr/bin/env node
// DB020: upload a reviewed Drizzle SNAPSHOT BLOB only. Do not create a tree,
// commit, ref, PR, migration or apply the duplicate generated SQL.
// The new Git object remains unreferenced until an independent exact-head
// review safely registers a forward-only, no-DDL snapshot baseline.
import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
export function requireReviewedSnapshotCandidate({catalog,semantic,defaults,snapshot,sourceSha}){
 if(!/^[0-9a-f]{40}$/.test(sourceSha||""))
  throw new Error("DB020 refuses missing exact source SHA");
 if(catalog?.kind!=="DB020_DISPOSABLE_PG17_REGISTERED_VS_GENERATED_DIAGNOSIS" ||
    catalog.passCertification!==false || catalog.registeredMigrations<327 ||
    catalog.counts?.generatedAbsentInRegisteredPg!==0 ||
    catalog.counts?.generatedTypedMissingColumns!==0 ||
    catalog.counts?.registeredExtraColumnsOnTypedTables!==0 ||
    catalog.counts?.typedFkShapesMissingFromCatalog!==0 ||
    catalog.counts?.unvalidatedFks!==0 ||
    catalog.counts?.catalogOnlyFkShapesOnTypedTables!==7 ||
    catalog.counts?.catalogOnlyFkShapesOnSqlOnlyTables!==30)
  throw new Error("DB020 PG catalog hard gaps or unclassified SQL-owned FK exception");
 if(semantic?.kind!=="DB020_REGISTERED_PG17_SEMANTIC_DRIFT_DIAGNOSIS" ||
    semantic.passCertification!==false ||
    semantic.registeredHead!==catalog.registeredHead ||
    semantic.registeredMigrations!==catalog.registeredMigrations ||
    semantic.counts?.hardDifferences!==0 ||
    semantic.counts?.typedCheckNamesAbsentFromCatalog!==0 ||
    semantic.counts?.typedIndexNamesAbsentFromCatalog!==0 ||
    semantic.counts?.unvalidatedRegisteredConstraintsAllTypes!==0 ||
    semantic.counts?.invalidPhysicalIndexes!==0 ||
    semantic.counts?.disabledRegisteredTriggers!==0)
  throw new Error("DB020 semantic catalog did not pass structural preflight");
 if(defaults?.kind!=="DB020_REGISTERED_PG17_DEFAULT_PROOF" ||
    defaults.registeredHead!==catalog.registeredHead ||
    defaults.registeredMigrations!==catalog.registeredMigrations ||
    defaults.defaultsStructurallyReconciled!==true ||
    defaults.unexplained?.length || defaults.missing?.length ||
    defaults.passCertification!==false)
  throw new Error("DB020 registered SQL defaults remain unexplained");
 if(snapshot?.dialect!=="postgresql" ||
    Object.keys(snapshot.tables||{}).length!==catalog.counts.generatedTypedTables ||
    !/^[0-9a-f-]{36}$/i.test(snapshot.id||""))
  throw new Error("DB020 generated snapshot missing or disagrees with registered catalog");
 return {sourceSha,registeredHead:catalog.registeredHead,registeredMigrations:catalog.registeredMigrations,
  typedTables:catalog.counts.generatedTypedTables,catalogTables:semantic.counts.catalogTables,
  missingColumns:semantic.counts.missingColumns,hardDifferences:semantic.counts.hardDifferences};
}
if(process.argv[1]?.endsWith("db020-upload-snapshot-blob.mjs")){
 if(process.env.DB020_SNAPSHOT_BLOB_ONLY!=="1" ||
    process.env.GITHUB_REPOSITORY!=="42Students/lms-vnext" ||
    !process.env.GITHUB_TOKEN)
  throw new Error("DB020 blob-only upload requires exact authorized main workflow");
 const sha=process.env.GITHUB_SHA;
 const git=spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"});
 if(git.status!==0||git.stdout.trim()!==sha)throw new Error("DB020 refuses stale checkout");
 const read=p=>JSON.parse(readFileSync(p,"utf8"));
 const bytes=readFileSync(".verification/db020-unapplied-generated-snapshot.json");
 const snapshot=JSON.parse(bytes.toString("utf8"));
 const receipt=requireReviewedSnapshotCandidate({
  catalog:read(".verification/db020-catalog-disposition.json"),
  semantic:read(".verification/db020-semantic-disposition.json"),
  defaults:read(".verification/db020-default-parity.json"),
  snapshot,sourceSha:sha,
 });
 const localSha=createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex");
 const response=await fetch("https://api.github.com/repos/42Students/lms-vnext/git/blobs",{
  method:"POST",
  headers:{"Authorization":"Bearer "+process.env.GITHUB_TOKEN,
   "Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",
   "Content-Type":"application/json"},
  body:JSON.stringify({content:bytes.toString("base64"),encoding:"base64"}),
 });
 if(!response.ok)throw new Error("GitHub blob upload failed: HTTP "+response.status);
 const posted=await response.json();
 if(posted.sha!==localSha)throw new Error("GitHub blob does not match locally reviewed snapshot");
 const result={...receipt,snapshotBlobSha:localSha,snapshotId:snapshot.id,
  prevSnapshotId:snapshot.prevId,blobOnly:true,
  committed:false,applied:false,phaseCertified:false};
 writeFileSync(".verification/db020-snapshot-blob-proposal.json",JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify(result,null,2));
}
