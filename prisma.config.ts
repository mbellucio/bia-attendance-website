import "dotenv/config";
import { defineConfig } from "prisma/config";

// This fallback lets Prisma generate its client before a database is connected.
// Set DIRECT_URL before running migrations; this placeholder is not a real DB.
const databaseUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/attendance";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
