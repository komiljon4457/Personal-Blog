// =============================================================================
// lib/slugify.js — turn a title into a URL-safe slug
//   "Three Days in the Dolomites!" -> "three-days-in-the-dolomites"
// =============================================================================

function slugify(input) {
  return String(input)
    .toLowerCase()
    .normalize("NFKD")               // split accented chars
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")     // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, "")         // trim leading/trailing hyphens
    .slice(0, 120);
}

module.exports = slugify;
