#!/usr/bin/env node
// Source decision reconciliation only; not PostgreSQL proof or Smrithi approval.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOURCE_DISPOSITIONS = Object.freeze({
  HISTORICAL_BACKUP_VALIDATE_RETIREMENT:'RETIRE_GREENFIELD_BACKUP',
  SCHEMA_TOOL_METADATA:'REPLACED_BY_PLATFORM_MIGRATION_METADATA',
  LEGACY_SUBSYSTEM_NEEDS_PRODUCT_DECISION:'PENDING_PRODUCT_DECISION',
});

export function reconcileDb00(source, review) {
  const errors=[];
  const fail=(code,extra={})=>errors.push({code,...extra});
  if (!source || !review || !Array.isArray(source.tables) || !Array.isArray(review.tables))
    return {verification:'SOURCE_DISPOSITION_ONLY_NOT_POSTGRES_ACCEPTANCE',errors:[{code:'INVALID_INPUT'}],valid:false,databaseVerified:false};
  if (source.domain!=='DB00_HISTORICAL_AND_ENGINE'||review.domain!==source.domain)
    fail('WRONG_DOMAIN');
  if (!/^[a-f0-9]{40}$/i.test(source.sourceSha||'') || source.sourceSha!==review.legacyOracleSha)
    fail('LEGACY_ORACLE_DRIFT',{sourceSha:source.sourceSha,reviewSha:review.legacyOracleSha});
  const bySource=new Map(),seen=new Set();
  let fields=0,retiredBackupFields=0,retiredBackupTables=0,replacedMetadataFields=0,replacedMetadataTables=0,pendingProductFields=0,pendingProductTables=0;
  let rawRetirementRows=0;
  for(const table of source.tables){
    if(typeof table.table!=='string'||bySource.has(table.table)||!Array.isArray(table.rows)){
      fail('DUPLICATE_OR_INVALID_SOURCE_TABLE',{table:table.table});continue;
    }
    bySource.set(table.table,table);
    fields+=table.rows.length;
    rawRetirementRows+=table.rows.filter(row=>row.reviewStatus==='CLASSIFY_HISTORIC_RETIREMENT').length;
  }
  for(const record of review.tables){
    const name=record?.table;
    if(typeof name!=='string'||seen.has(name)){
      fail('DUPLICATE_OR_INVALID_DISPOSITION',{table:name});continue;
    }
    seen.add(name);
    const original=bySource.get(name);
    if(!original){fail('DISPOSITION_UNKNOWN_TABLE',{table:name});continue;}
    const required=SOURCE_DISPOSITIONS[original.sourceTableClass];
    if(!required){fail('UNKNOWN_SOURCE_TABLE_CLASS',{table:name,sourceClass:original.sourceTableClass});continue;}
    if(record.sourceClass!==original.sourceTableClass || record.disposition!==required)
      fail('DISPOSITION_MISMATCH',{table:name,expected:required,actual:record.disposition});
    if(record.sourceFieldCount!==original.rows.length)
      fail('DISPOSITION_FIELD_COUNT_MISMATCH',{table:name,source:original.rows.length,review:record.sourceFieldCount});
    if(required==='RETIRE_GREENFIELD_BACKUP') {retiredBackupTables++;retiredBackupFields+=original.rows.length;}
    if(required==='REPLACED_BY_PLATFORM_MIGRATION_METADATA') {replacedMetadataTables++;replacedMetadataFields+=original.rows.length;}
    if(required==='PENDING_PRODUCT_DECISION') {pendingProductTables++;pendingProductFields+=original.rows.length;}
  }
  for(const name of bySource.keys())if(!seen.has(name))fail('MISSING_TABLE_DISPOSITION',{table:name});
  const summary={tables:source.tables.length,fields,retiredBackupTables,retiredBackupFields,
    replacedMetadataTables,replacedMetadataFields,pendingProductTables,pendingProductFields,
    sourceLedgerRetirementCandidateRows:rawRetirementRows,
    sourceDispositionClosedTables:retiredBackupTables+replacedMetadataTables,
    sourceDispositionClosedFields:retiredBackupFields+replacedMetadataFields};
  const declared=review.counts||{};
  for(const [key,actual] of [
    ['candidateTables',summary.tables],['candidateFields',summary.fields],
    ['tableDispositionsClosed',summary.sourceDispositionClosedTables],
    ['fieldCandidatesDispositionedByTableDecision',summary.sourceDispositionClosedFields],
    ['pendingProductDecisionTables',summary.pendingProductTables],
    ['pendingProductDecisionFields',summary.pendingProductFields],
  ]) if(declared[key]!==actual)fail('REVIEW_TOTAL_DRIFT',{key,declared:declared[key],actual});
  if(source.counts?.tables!==summary.tables||source.counts?.fields!==summary.fields)
    fail('SOURCE_TOTAL_DRIFT',{declared:source.counts,actual:{tables:summary.tables,fields:summary.fields}});
  return {verification:'SOURCE_DISPOSITION_ONLY_NOT_POSTGRES_ACCEPTANCE',valid:errors.length===0,
    databaseVerified:false,smrithiProductDecisionClosed:false,summary,errors};
}

export function reconcileCheckout(root) {
  const read=name=>JSON.parse(fs.readFileSync(path.join(root,'docs/planning',name),'utf8'));
  return reconcileDb00(read('db-pass4-columns-db00_historical_and_engine.json'),read('db00-historical-engine-disposition.json'));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const root=process.argv[2]?path.resolve(process.argv[2]):path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
    const report=reconcileCheckout(root);console.log(JSON.stringify(report,null,2));
    if(!report.valid)process.exitCode=2;
  }catch(error){console.error(error);process.exitCode=1;}
}
