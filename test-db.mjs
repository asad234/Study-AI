// test-db.js
import { Client } from 'pg'; 
const connectionString = "postgresql://postgres.cjrgcpguezljtzbkxumk:ShowPassword1414pP@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"; 
async function testConnection() { 
  const client = new Client({ connectionString });
  try { await client.connect(); 
    console.log('✅ SUCCESS: Connected to Supabase database!'); // Test a simple query 
    const result = await client.query('SELECT NOW() as current_time'); 
    console.log('📅 Database time:', result.rows[0].current_time); 
  await client.end(); 
  return true; } 
  catch (error) { 
    console.log('❌ ERROR: Could not connect to database'); 
    console.log('Error details:', error.message); 
    return false; 
  
  
} 
}
testConnection();