// =============================================================================
// app.js — Express application setup (view engine, static assets, routes)
// =============================================================================

const path = require("path");
const express = require("express");

const publicRoutes = require("./routes/index");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./routes/api");
const yoga = require("./graphql");

const app = express();

// ---- View engine: EJS -------------------------------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---- GraphQL endpoint (mounted BEFORE the body parsers) ---------------------
// Yoga parses its own request body; letting express.json() run first would
// consume the stream and hang GraphQL. Serves GraphiQL in a browser at /graphql.
app.use(yoga.graphqlEndpoint, yoga);

// ---- Body parsing -----------------------------------------------------------
app.use(express.urlencoded({ extended: false })); // HTML form posts
app.use(express.json()); // REST API (application/json)

// ---- Static assets ----------------------------------------------------------
// Reuse the prototype's compiled CSS and images at /css and /assets.
const proto = path.join(__dirname, "..", "prototype");
app.use("/css", express.static(path.join(proto, "css")));
app.use("/assets", express.static(path.join(proto, "assets")));
app.use("/js", express.static(path.join(proto, "js"))); // client-side scripts (CSR view)

// ---- View helpers (available in every template) -----------------------------
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

app.locals.formatDate = function (sqlDate) {
  if (!sqlDate) return "";
  const [y, m, d] = sqlDate.slice(0, 10).split("-").map(Number);
  if (!y) return "";
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

app.locals.isoDate = function (sqlDate) {
  return sqlDate ? sqlDate.slice(0, 10) : "";
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Render post content (escaped) as paragraphs, preserving line breaks.
app.locals.paragraphs = function (text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
};

// Make the current path available to every view (for nav highlighting).
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// ---- Routes -----------------------------------------------------------------
app.use("/api", apiRoutes);
app.use("/", publicRoutes);
app.use("/", adminRoutes);

// ---- 404 --------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).render("404", { title: "Not found" });
});

// ---- Error handler ----------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("500", { title: "Server error" });
});

module.exports = app;
