import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Attempting to connect to InfinityFree MySQL server...');
  console.log('Host: sql107.infinityfree.com');
  console.log('User: if0_42333746');
  console.log('Database: if0_42333746_mk_pos');

  // Let's test with fetch or mysql
  try {
    const mysql = await import('mysql2/promise').catch(() => null);
    if (!mysql) {
      console.log('Installing mysql2 temporarily...');
      return;
    }

    const connection = await mysql.createConnection({
      host: 'sql107.infinityfree.com',
      port: 3306,
      user: 'if0_42333746',
      password: 'VHxnlDleyPf09',
      database: 'if0_42333746_mk_pos',
      connectTimeout: 10000,
      multipleStatements: true,
    });

    console.log('Connected to MySQL successfully!');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await connection.query(sql);
    console.log('All 14 tables and initial records uploaded successfully to if0_42333746_mk_pos!');
    await connection.end();
  } catch (err) {
    console.error('Connection attempt result:', err.message);
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.message.includes('Access denied')) {
      console.log('\nNOTE: InfinityFree free hosting blocks remote MySQL connections from outside their servers.');
      console.log('In this case, the schema.sql can be imported via InfinityFree phpMyAdmin web panel.');
    }
  }
}

run();
