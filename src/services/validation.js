/**
 * validation.js
 *
 * Reusable form validation + input-sanitization helpers for the public
 * enrollment surfaces. The rules here must stay aligned with the Joi
 * schemas on the backend (src/modules/enrollments/enrollment.validator.js)
 * — the backend is the authoritative gate, this module is the UX layer.
 *
 * Conventions
 * -----------
 * Each field has two functions:
 *
 *   sanitize<Field>(rawInput)  — pure, idempotent. Returns a "clean"
 *                                version of the input that is safe to
 *                                show back to the user in the controlled
 *                                input. Used inside `onChange`. NEVER
 *                                throws; on any non-string input it
 *                                returns ''.
 *
 *   validate<Field>(value)     — pure. Returns null when `value` is
 *                                acceptable, otherwise a human-readable
 *                                error string. Used to populate the
 *                                live-errors object and decide whether
 *                                Continue is enabled.
 *
 * sanitize* shapes the keystrokes the user can SEE; validate* shapes
 * what they can SUBMIT. The two are intentionally separate because
 * over-aggressive sanitization (e.g. stripping characters silently)
 * destroys keystrokes and frustrates users — we want feedback, not
 * invisible rejection.
 *
 * Why these particular regexes
 * ----------------------------
 *   Name  — ASCII letters + single spaces. Indian student names in
 *           Latin script never need digits or punctuation; allowing them
 *           lets through obvious junk ("Vivek123", "test@@@") and
 *           pollutes downstream CRMs.
 *   Phone — 10 digits, must start 6/7/8/9. India's TRAI mobile
 *           numbering plan reserves the leading digit; "5…" and below
 *           are landline / unassigned ranges. Strict prefix check stops
 *           bots / dummy data at the form layer.
 *   Email — local@domain.tld with a 2+ char TLD. The TLD-length rule
 *           kills the "test@gmail.c" typo, which the basic `<input
 *           type=email>` validation accepts.
 *
 * Both the regex AND the human-readable error messages are exported so
 * callers can render their own UI without coupling to error strings.
 */

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

/**
 * Full-name validity pattern.
 *
 * Allowed: one or more ASCII letter runs joined by SINGLE spaces.
 *   ✓ "Vivek"
 *   ✓ "Vivek Patil"
 *   ✓ "Anand Pratap Singh"
 * Rejected:
 *   ✗ "Vivek123"        (digits)
 *   ✗ "Vivek@"          (symbol)
 *   ✗ "Vivek  Patil"    (consecutive spaces — sanitizeName collapses these)
 *   ✗ " Vivek"          (leading space — trim before validation)
 *
 * The sanitizer drops everything that isn't a letter/space and collapses
 * runs of whitespace, so by the time validateName sees a value the only
 * way it can fail this regex is if the user explicitly cleared the field.
 */
export const NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

/** Minimum trimmed length we count as a "real" name. */
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;

/**
 * Drop any character that isn't an ASCII letter or whitespace, then
 * collapse internal whitespace runs to single spaces. Does NOT trim
 * leading/trailing spaces — that would prevent the user from typing
 * "Vivek " before typing the next word. Trimming is done at validate
 * + submit time instead.
 */
export function sanitizeName(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[^A-Za-z\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function validateName(value) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return 'Full name is required';
  if (trimmed.length < NAME_MIN_LENGTH) return 'Enter your full name';
  if (trimmed.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or less`;
  if (!NAME_REGEX.test(trimmed)) return 'Use letters and spaces only';
  return null;
}

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

/**
 * Indian mobile pattern: 10 digits, first digit 6-9.
 *
 * Allowed: 9876543210, 8123456789, 7000000001, 6999999999
 * Rejected:
 *   ✗ 5123456789       (TRAI: leading 0-5 are landline / unassigned)
 *   ✗ 98765432         (too short)
 *   ✗ 98765432109      (too long — sanitizer truncates to 10 so this
 *                       only fires if a caller bypasses sanitization)
 */
export const PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Coerce arbitrary clipboard noise into the 10-digit shape we accept.
 *
 *   1. Drop everything that isn't a digit (kills spaces, dashes, "+",
 *      parentheses, "ext", etc.).
 *   2. If the result is a 12-digit number starting "91" it's almost
 *      certainly an Indian number with the country code on the front
 *      ("+91 9876543210" → "919876543210"); strip the leading "91".
 *      Same treatment for "091…" (some clipboards add a leading zero).
 *   3. Hard-truncate to 10 digits so the input never overflows.
 */
export function sanitizePhone(input) {
  if (typeof input !== 'string') return '';
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith('091')) {
    digits = digits.slice(3);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // "09876543210" — domestic STD prefix; drop the leading 0.
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function validatePhone(value) {
  const v = sanitizePhone(value ?? '');
  if (!v) return 'Mobile number is required';
  if (v.length !== 10) return 'Enter a 10-digit mobile number';
  if (!PHONE_REGEX.test(v)) return 'Mobile number must start with 6, 7, 8, or 9';
  return null;
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/**
 * Strict email pattern.
 *   local@domain.tld
 *
 *   local  — one or more characters that aren't whitespace or "@"
 *            (we let "+" through because Gmail aliases use it).
 *   domain — one or more chars before the final ".", may itself contain
 *            sub-domains ("yahoo.co" inside "yahoo.co.in").
 *   tld    — 2+ ASCII letters. The 2-character minimum kills the
 *            "test@gmail.c" typo that <input type=email> accepts.
 *
 * Not RFC 5322 — we deliberately do NOT accept exotic local-parts (quoted
 * strings, IP literals, IDN). 99.99% of real student emails fit this
 * pattern; the long tail is better handled by the email-verify mailer.
 */
export const EMAIL_REGEX =
  /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9](?:[A-Za-z0-9.\-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/;

const EMAIL_MAX_LENGTH = 255;

export function sanitizeEmail(input) {
  if (typeof input !== 'string') return '';
  // Strip whitespace anywhere (paste from email clients often appends
  // a trailing space). Don't lowercase here — the user's controlled
  // input should preserve the casing they typed. Backend lowercases
  // for storage.
  return input.replace(/\s+/g, '');
}

export function validateEmail(value) {
  const v = sanitizeEmail(value ?? '');
  if (!v) return 'Email is required';
  if (v.length > EMAIL_MAX_LENGTH) return `Email must be ${EMAIL_MAX_LENGTH} characters or less`;
  if (!EMAIL_REGEX.test(v)) return 'Enter a valid email address';
  return null;
}

// ---------------------------------------------------------------------------
// Aggregate runner — used by EnrollModal's step-0 gate
// ---------------------------------------------------------------------------

/**
 * Validate the required fields on step 0 of the enrollment modal.
 * Centralised here (rather than inlined in the modal) so any future
 * surface that collects the same fields (admin form, partner sites) can
 * use the identical rules.
 *
 * Required fields: name, phone, email, role, education.
 * (Step-1 fields — readiness, source — remain optional.)
 *
 * @param {{ name?: string, phone?: string, email?: string, role?: string, education?: string }} data
 * @returns {{ name?: string, phone?: string, email?: string, role?: string, education?: string }}
 *   An object whose keys are field names and values are error strings.
 *   Empty object means all required fields are valid.
 */
export function validateEnrollmentBasics(data) {
  const errors = {};
  const name  = validateName(data?.name);
  const phone = validatePhone(data?.phone);
  const email = validateEmail(data?.email);
  if (name)  errors.name  = name;
  if (phone) errors.phone = phone;
  if (email) errors.email = email;
  if (!data?.role) errors.role = 'Please select who you are';
  if (!data?.education) errors.education = 'Please select your education level';
  return errors;
}
