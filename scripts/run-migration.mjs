#!/usr/bin/env node
/**
 * Applies a .sql migration file to the project's Postgres through the
 * self-hosted Supabase meta endpoint. Works identically against the Hostinger
 * VPS instance — only NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 * change.
 *
 *   node scripts/run-migration.mjs migrations/0001_rls_hardening.sql
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

// Local runs keep credentials in .env.local; on the VPS they come from the real
// environment, which dotenv never overwrites.
loadEnv({ path: resolve(process.cwd(), '.env.local') });
loadEnv({ path: resolve(process.cwd(), '.env') });

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-migration.mjs <path-to-sql>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sql = readFileSync(resolve(process.cwd(), file), 'utf8');

const res = await fetch(`${url.replace(/\/$/, '')}/pg/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({ query: sql }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`Migration FAILED (HTTP ${res.status}):\n${body}`);
  process.exit(1);
}
console.log(`Migration applied: ${file}`);
if (body && body !== '[]') console.log(body);
