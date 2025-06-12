// NOTE: This file is for server-side use only and should not be imported in client code.
// Direct database connections should only be used in secure environments like:
// - Backend services
// - Edge functions
// - Server components
// - Admin tools

// To use this in a Node.js environment, you'll need to install:
// npm install pg

/*
Example usage:

import { pool } from './db-connection';

async function queryDatabase() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM your_table LIMIT 10');
    return result.rows;
  } finally {
    client.release();
  }
}
*/

// Uncomment and use in server-side code only
/*
import { Pool } from 'pg';

const CONNECTION_STRING = 'postgresql://postgres.jczawpxfipfceactrwry:.LBaJaL3gwqzV6u@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

export const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});
*/ 