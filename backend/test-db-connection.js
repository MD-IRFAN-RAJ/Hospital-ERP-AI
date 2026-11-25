require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  console.log('==================================================');
  console.log('Testing Database Connection from Backend...');
  console.log('==================================================');

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('❌ Error: DATABASE_URL is not set in backend/.env');
    process.exit(1);
  }

  console.log('Raw DATABASE_URL found in .env');

  let parsed;
  try {
    parsed = new URL(rawUrl);
    console.log(`Protocol: ${parsed.protocol}`);
    console.log(`Host:     ${parsed.hostname}`);
    console.log(`Port:     ${parsed.port || '5432'}`);
    console.log(`Database: ${parsed.pathname.replace('/', '')}`);
    console.log(`Username: ${parsed.username}`);
    console.log(`Password: ${parsed.password ? '****** (provided)' : 'MISSING'}`);
  } catch (err) {
    console.error(`❌ URL Parsing Error: ${err.message}`);
    console.log('Tip: Check if your password contains unencoded special characters like /, %, @, #, etc.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: rawUrl,
    connectionTimeoutMillis: 8000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\nAttempting to connect to PostgreSQL server...');
    const startTime = Date.now();
    await client.connect();
    const duration = Date.now() - startTime;
    console.log(`✅ Connection ESTABLISHED in ${duration}ms!`);

    const res = await client.query('SELECT version(), current_database(), current_user;');
    console.log('\n--- Database Metadata ---');
    console.log(`Database: ${res.rows[0].current_database}`);
    console.log(`User:     ${res.rows[0].current_user}`);
    console.log(`Version:  ${res.rows[0].version}`);
    console.log('-------------------------');

    await client.end();
    console.log('\n🎉 Supabase Database Connection is 100% READY for schema push and data seeding!');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Connection Failed: ${err.message}`);
    if (err.code) console.error(`Error Code: ${err.code}`);

    if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.log('\n💡 Diagnostic Tip:');
      console.log('The host could not be resolved. Supabase direct URLs (db.<project-ref>.supabase.co)');
      console.log('use IPv6 only. If your network does not have IPv6, please copy the');
      console.log('"Connection Pooler" URL (Session mode) from Supabase dashboard -> Project Settings -> Database.');
    } else if (err.message.includes('password authentication failed') || err.message.includes('SASL')) {
      console.log('\n💡 Diagnostic Tip:');
      console.log('Password authentication failed. Please verify your database password.');
    }
    process.exit(1);
  }
}

testConnection();

