import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

declare global {
  var __devroastDbPool__: Pool | undefined;
}

const pool =
  globalThis.__devroastDbPool__ ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__devroastDbPool__ = pool;
}

export const db = drizzle(pool, {
  casing: "snake_case",
  schema,
});

export { pool };
