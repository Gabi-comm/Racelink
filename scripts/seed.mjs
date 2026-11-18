// load database/seed.sql gamit ang .env.local
import { readFile } from "node:fs/promises";
import { config } from "dotenv";
import mysql from "mysql2/promise";

config({ path: ".env.local" });

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? "Amazon RDS" : undefined,
  multipleStatements: true,
});

try {
  await conn.query(await readFile(new URL("../database/seed.sql", import.meta.url), "utf8"));
  console.log(`Seeded ${process.env.DB_NAME}.`);
} finally {
  await conn.end();
}
