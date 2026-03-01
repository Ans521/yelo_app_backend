const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
  }
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'yelo_backend',
  };
  const sqlPath = path.join(__dirname, '..', 'sample-business-inserts.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8').replace(/--[^\n]*\n/g, '').trim();
  const conn = await mysql.createConnection(config);
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
    await conn.query(stmt);
  }
  conn.end();
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
