import { pool } from './db.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const migrations = [
  '../migrations/001_create_plans.sql',
  '../migrations/002_create_customers.sql',
  '../migrations/003_create_usage_logs.sql',
  '../migrations/004_create_payments.sql',
  '../migrations/005_seed_data.sql',
  '../migrations/006_create_actors.sql',
  '../migrations/007_seed_actors.sql',
  '../migrations/008_seed_fb_actors.sql',
  '../migrations/009_fix_actor_ids.sql',
  '../migrations/010_remove_broken_actors.sql',
];

async function migrate() {
  for (const file of migrations) {
    const sql = await readFile(join(__dirname, file), 'utf8');
    await pool.query(sql);
    console.log(`✓ ${file}`);
  }
  console.log('Migrations complete');
  await pool.end();
}

migrate().catch(console.error);
