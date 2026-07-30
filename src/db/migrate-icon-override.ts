import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const flatPineSql = neon("postgresql://neondb_owner:npg_pu9zYH0TbtLE@ep-flat-pine-axcuqz1c-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

async function main() {
  const countRes = await sql`SELECT count(*) FROM expenses;`;
  console.log("EXACT TOTAL EXPENSES COUNT:", countRes[0].count);

  const top10 = await sql`SELECT id, raw_text, amount, date FROM expenses ORDER BY created_at DESC LIMIT 10;`;
  console.log("TOP 10 RECENT EXPENSES:");
  console.log(JSON.stringify(top10, null, 2));
}

main().catch(console.error);
