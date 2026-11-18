import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  dialect: "mysql",
  schema: "./lib/db/schema.ts",
  out: "./database/migrations",
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME!,
    ssl: process.env.DB_SSL === "true" ? "Amazon RDS" : undefined,
  },
});
