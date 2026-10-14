import { spawnSync } from "node:child_process";

function run(args) {
  const result = spawnSync("npm", args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL in Vercel Production before deploying.");
  }
  // prisma.config.ts prefers DIRECT_URL for migration DDL, and falls back to DATABASE_URL.
  run(["run", "db:deploy"]);
  run(["run", "db:import-logs", "--", "--apply"]);
}

run(["run", "build"]);
