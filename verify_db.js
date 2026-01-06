const postgres = require('postgres');
const sql = postgres("postgresql://neondb_owner:npg_JdDs95VWcglK@ep-divine-cell-ag2sr0k3-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require");

async function verify() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('\n✅ Database tables created successfully:\n');
    tables.forEach(t => console.log('  -', t.table_name));
    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verify();
