// =============================================================================
// services/contactService.js — BUSINESS LOGIC for the contact form.
// =============================================================================

const contactRepository = require("../repositories/contactRepository");
const { ValidationError } = require("../lib/errors");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECTS = ["feedback", "topic", "collab", "other"];

const contactService = {
  submit(input) {
    const errors = {};
    if (!input.name || input.name.trim().length < 2)
      errors.name = "Please enter your name.";
    if (!input.email || !EMAIL_RE.test(input.email))
      errors.email = "Please enter a valid email address.";
    if (!input.subject || !SUBJECTS.includes(input.subject))
      errors.subject = "Please choose a subject.";
    if (!input.message || input.message.trim().length < 10)
      errors.message = "Message must be at least 10 characters.";
    if (!input.consent) errors.consent = "Please agree before sending.";
    if (Object.keys(errors).length) throw new ValidationError(errors);

    return contactRepository.insert({
      name: input.name.trim(),
      email: input.email.trim(),
      website: (input.website || "").trim() || null,
      subject: input.subject,
      message: input.message.trim(),
    });
  },
};

module.exports = contactService;
