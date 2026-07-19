// =============================================================================
// db/migrate.js — apply schema.sql to the database (idempotent)
// Run with:  npm run db:migrate
// =============================================================================

const fs = require("fs");
const path = require("path");
const db = require("./connection");

function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);
  console.log("✓ Schema applied.");
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
