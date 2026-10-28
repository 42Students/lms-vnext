#!/usr/bin/env node
/**
 * DB-004: fail-closed gate for destructive, disposable PostgreSQL test setup.
 * CI is not required. No schema changes or connections happen in this guard.
 *
 * Usage before `npm run db:test:prepare`:
 *   node scripts/db01-test-database-guard.mjs
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function readPgTarget(raw, name) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    throw new Error(`${name} must be explicitly set; no fallback is permitted`);
  }
  let url;
  try { url = new URL(raw); } catch { throw new Error(`${name} is not a valid PostgreSQL URL`); }
  if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
    throw new Error(`${name} must use a PostgreSQL URL`);
  }
  if (!url.hostname) {
    // PostgreSQL URI parsers can fall back to PGHOST/Unix sockets when the
    // hostname is empty. A destructive target must never be resolved by env.
    throw new Error(`${name} must include an explicit PostgreSQL host`);
  }
  const targetOverrideParams = ['host', 'hostaddr', 'port', 'database', 'dbname'];
  const redirectedBy = targetOverrideParams.find((key) => url.searchParams.has(key));
  if (redirectedBy) {
    throw new Error(`${name} query parameter "${redirectedBy}" may redirect the destructive target`);
  }
  let db;
  try { db = decodeURIComponent(url.pathname.replace(/^\//, '')); }
  catch { throw new Error(`${name} contains invalid database encoding`); }
  if (!db || db.includes('/') || !/^[a-z0-9_]+$/i.test(db)) {
    throw new Error(`${name} must specify a simple database name`);
  }
  return { host: url.hostname.toLowerCase(), port: url.port || '5432', db };
}

export function assertSafeDb01TestTarget(env = process.env) {
  const test = readPgTarget(env.TEST_DATABASE_URL, 'TEST_DATABASE_URL');
  if (!/^(?:(?:test|e2e)_[a-z0-9_]+|[a-z0-9_]+_(?:test|e2e)(?:_[a-z0-9]+)*)$/i.test(test.db)) {
    throw new Error('Refusing to reset a database whose name is not explicitly a test database or E2E database');
  }
  if (env.DATABASE_URL) {
    const app = readPgTarget(env.DATABASE_URL, 'DATABASE_URL');
    // localhost, IPv4 loopback and IPv6 loopback can reach the same
    // PostgreSQL socket despite different spelling. Never let the host
    // alias alone exempt a configured application database from refusal.
    const sameHost = test.host === app.host ||
      (LOCAL_HOSTS.has(test.host) && LOCAL_HOSTS.has(app.host));
    if (test.db.toLowerCase() === app.db.toLowerCase() &&
        sameHost && test.port === app.port) {
      throw new Error('Refusing to reset the configured application database');
    }
  }
  if (!LOCAL_HOSTS.has(test.host)) {
    const expected = `RESET:${test.host}/${test.db}`;
    if (env.DB01_REMOTE_TEST_DATABASE_CONFIRM !== expected) {
      throw new Error('Remote test database requires DB01_REMOTE_TEST_DATABASE_CONFIRM for the exact target');
    }
  }
  return { host: test.host, database: test.db, mode: LOCAL_HOSTS.has(test.host) ? 'local' : 'explicit-remote' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const target = assertSafeDb01TestTarget();
    process.stdout.write(`DB01 test-target preflight PASS: ${target.mode} ${target.host}/${target.database}; no database touched\n`);
  } catch (error) {
    process.stderr.write(`DB01 test-target preflight REFUSED: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}
