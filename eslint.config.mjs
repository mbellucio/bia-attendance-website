import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/db.ts", "src/app/api/**/route.ts", "src/generated/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/lib/db", "**/lib/db", "**/lib/db.*", "@/generated/prisma/**", "**/generated/prisma/**", "@prisma/*", "pg"],
          message: "Database access belongs in src/app/api/**/route.ts. Use the network layer and endpoint catalog from UI code.",
        }],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
