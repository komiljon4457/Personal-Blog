// =============================================================================
// server.js — start the HTTP server
// =============================================================================

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Personal Blog running at http://localhost:${PORT}`);
});
