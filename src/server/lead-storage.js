import { randomUUID } from "node:crypto";
import { Pool } from "pg";

let pool = null;
let initPromise = null;

function shouldUseSsl(connectionString) {
  return !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");
}

function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

async function ensureLeadsTable() {
  if (initPromise) {
    return initPromise;
  }

  const db = getPool();
  initPromise = (async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
    `);
  })();

  return initPromise;
}

export async function pingDatabase() {
  await ensureLeadsTable();
  await getPool().query("SELECT 1");
}

export async function listLeads() {
  await ensureLeadsTable();

  const result = await getPool().query(
    `SELECT payload FROM leads ORDER BY created_at DESC`,
  );

  return result.rows.map((row) => row.payload);
}

export async function insertLead(lead) {
  await ensureLeadsTable();

  const record = {
    id: randomUUID(),
    ...lead,
    createdAt: new Date().toISOString(),
  };

  await getPool().query(
    `INSERT INTO leads (id, payload, created_at) VALUES ($1, $2::jsonb, $3::timestamptz)`,
    [record.id, JSON.stringify(record), record.createdAt],
  );

  return record;
}

export async function getLeadById(id) {
  await ensureLeadsTable();

  const result = await getPool().query(
    `SELECT payload FROM leads WHERE id = $1 LIMIT 1`,
    [id],
  );

  if (!result.rows.length) {
    return null;
  }

  return result.rows[0].payload;
}
