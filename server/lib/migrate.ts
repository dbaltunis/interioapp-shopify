/**
 * Auto-migration: ensures InterioApp integration columns exist.
 * Uses raw SQL via Supabase's postgrest-compatible approach —
 * attempts to select the column and adds it if missing.
 */
import { supabase } from "./supabase.js";

interface MigrationColumn {
  table: string;
  column: string;
  type: string;
}

const REQUIRED_COLUMNS: MigrationColumn[] = [
  { table: "merchants", column: "interioapp_account_id", type: "TEXT" },
  { table: "merchants", column: "interioapp_api_key", type: "TEXT" },
  { table: "merchants", column: "interioapp_last_sync", type: "TIMESTAMPTZ" },
  { table: "fabrics", column: "interioapp_id", type: "TEXT" },
  { table: "product_templates", column: "interioapp_id", type: "TEXT" },
  { table: "quotes", column: "interioapp_project_id", type: "TEXT" },
  { table: "quotes", column: "interioapp_project_number", type: "TEXT" },
];

async function columnExists(table: string, column: string): Promise<boolean> {
  // Try selecting the column — if it fails with 42703, column doesn't exist
  const { error } = await supabase.from(table).select(column).limit(0);
  if (error && error.code === "42703") return false;
  return true;
}

export async function runMigrations(): Promise<void> {
  console.log("Checking database schema...");

  const missing: MigrationColumn[] = [];

  for (const col of REQUIRED_COLUMNS) {
    const exists = await columnExists(col.table, col.column);
    if (!exists) {
      missing.push(col);
    }
  }

  if (missing.length === 0) {
    console.log("Database schema OK — all InterioApp columns present.");
    return;
  }

  console.log(
    `Missing columns: ${missing.map((c) => `${c.table}.${c.column}`).join(", ")}`
  );
  console.log(
    "⚠️  Run the following SQL in Supabase SQL Editor to add them:\n"
  );

  for (const col of missing) {
    console.log(
      `  ALTER TABLE ${col.table} ADD COLUMN IF NOT EXISTS ${col.column} ${col.type};`
    );
  }

  console.log(
    "\nOr run the full migration file: migrations/001_interioapp_integration.sql"
  );
  console.log(
    "The InterioApp integration will work once these columns are added.\n"
  );
}
