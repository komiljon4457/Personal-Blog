// =============================================================================
// lib/errors.js — a domain-level validation error carrying field messages.
// Controllers catch this to re-render a form with errors (HTTP 400) instead of
// crashing with a 500.
// =============================================================================

class ValidationError extends Error {
  constructor(errors) {
    super("Validation failed");
    this.name = "ValidationError";
    this.errors = errors; // { field: "message", ... }
  }
}

module.exports = { ValidationError };
