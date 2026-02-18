/**
 * @file Cloudflare Workers entrypoint.
 *
 * Initializes database and auth context, then mounts the core Hono app.
 */

import { Hono } from "hono";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import app from "./lib/app.js";
import { createAuth } from "./lib/auth.js";
import type { AppContext } from "./lib/context.js";
import { createDb } from "./lib/db.js";
import type { Env } from "./lib/env.js";
import {
  errorHandler,
  notFoundHandler,
  requestIdGenerator,
} from "./lib/middleware.js";

type CloudflareEnv = {
  HYPERDRIVE_CACHED: Hyperdrive;
  HYPERDRIVE_DIRECT: Hyperdrive;
} & Env;

const worker = new Hono<{
  Bindings: CloudflareEnv;
  Variables: AppContext["Variables"];
}>();

// Error and 404 handlers (must be on top-level app)
worker.onError(errorHandler);
worker.notFound(notFoundHandler);

// Standard middleware
worker.use(secureHeaders());
worker.use(requestId({ generator: requestIdGenerator }));
worker.use(logger());

// Initialize shared context for all requests
worker.use(async (c, next) => {
  const db = createDb(c.env.HYPERDRIVE_CACHED);
  const dbDirect = createDb(c.env.HYPERDRIVE_DIRECT);
  const auth = createAuth(db, c.env);

  c.set("db", db);
  c.set("dbDirect", dbDirect);
  c.set("auth", auth);

  await next();
});

// Retry transient errors (cold-start DB connection failures, Hyperdrive init)
worker.use(async (c, next) => {
  try {
    await next();
  } catch (err) {
    // Retry once on connection-related errors
    const msg = err instanceof Error ? err.message : "";
    const isTransient =
      msg.includes("connection") ||
      msg.includes("CONNECT_TIMEOUT") ||
      msg.includes("fetch failed") ||
      msg.includes("terminated");
    if (isTransient) {
      console.warn("[retry] Transient error, retrying once:", msg);
      // Re-create DB connections for fresh attempt
      const db = createDb(c.env.HYPERDRIVE_CACHED);
      const dbDirect = createDb(c.env.HYPERDRIVE_DIRECT);
      const auth = createAuth(db, c.env);
      c.set("db", db);
      c.set("dbDirect", dbDirect);
      c.set("auth", auth);
      await next();
    } else {
      throw err;
    }
  }
});

// Mount the core API app
worker.route("/", app);

export default worker;
