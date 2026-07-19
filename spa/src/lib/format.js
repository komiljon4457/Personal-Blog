// Small formatting helpers shared across components.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatDate(sqlDate) {
  if (!sqlDate) return "";
  const [y, m, d] = String(sqlDate).slice(0, 10).split("-").map(Number);
  return y ? `${d} ${MONTHS[m - 1]} ${y}` : "";
}

export function isoDate(sqlDate) {
  return sqlDate ? String(sqlDate).slice(0, 10) : "";
}

// Split post content into paragraphs (blank-line separated) for rendering.
export function paragraphs(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}
