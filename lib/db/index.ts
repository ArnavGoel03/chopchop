import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

// During local dev or preview without a DB, `db` is null and callers fall back
// to a no-DB path (orders still confirm via WhatsApp). This keeps the store
// usable before Neon is provisioned.
export const db = url ? drizzle(neon(url), { schema }) : null;

export const hasDb = Boolean(url);
export { schema };
