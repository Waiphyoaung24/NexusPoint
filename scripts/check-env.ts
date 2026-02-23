#!/usr/bin/env bun

/**
 * Quick environment checker
 * Shows which database and environment you're currently using
 */

const DATABASE_URL = process.env.DATABASE_URL || "NOT SET";
const API_ORIGIN = process.env.API_ORIGIN || "NOT SET";
const APP_ORIGIN = process.env.APP_ORIGIN || "NOT SET";
const ENVIRONMENT = process.env.ENVIRONMENT || "NOT SET";

console.log("\n🔍 Current Environment Configuration\n");
console.log("━".repeat(60));

// Detect environment
const isLocal =
  DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1");
const isNeon = DATABASE_URL.includes("neon.tech");
const isProd = isNeon || ENVIRONMENT === "production" || ENVIRONMENT === "prod";

console.log(
  `Environment: ${isProd ? "🔴 PRODUCTION" : "🟢 LOCAL DEVELOPMENT"}`,
);
console.log(`ENVIRONMENT var: ${ENVIRONMENT}`);
console.log("");

console.log("🗄️  Database:");
if (isLocal) {
  console.log("   Status: ✅ Local PostgreSQL");
  console.log(`   URL: ${DATABASE_URL}`);
} else if (isNeon) {
  console.log("   Status: ⚠️  Neon PostgreSQL (Production)");
  const masked = DATABASE_URL.replace(/:[^:@]+@/, ":***@");
  console.log(`   URL: ${masked}`);
} else {
  console.log("   Status: ❓ Unknown");
  console.log(`   URL: ${DATABASE_URL}`);
}

console.log("");
console.log("🌐 Origins:");
console.log(`   App: ${APP_ORIGIN}`);
console.log(`   API: ${API_ORIGIN}`);

console.log("");
console.log("━".repeat(60));

if (isProd) {
  console.log("\n⚠️  WARNING: You are connected to PRODUCTION database!");
  console.log("   Be careful not to corrupt production data.");
  console.log("   To switch to local: bun api:dev\n");
} else {
  console.log("\n✅ Safe to develop - using local database");
  console.log("   To test with production: bun api:dev:prod\n");
}
