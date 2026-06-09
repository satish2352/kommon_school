# QA Test Report — Enrollment Management System (End-to-End)

**Date:** 2026-06-08
**Tester role:** Senior QA / BA / Product Tester
**Environment:** Backend `Express + Prisma/PostgreSQL` @ `http://localhost:3000` (live, healthy), DB `postgresql://…@13.48.254.211:5432/kommon` (remote shared dev), Frontend `React 19 + Vite`.
**Method:** Step 1 data cleanup (authorized, executed) → live HTTP E2E against the running API (92 checks across two runs) → code-level audit of FE+BE for items not drivable live.

> **Scope honesty note.** All API, validation, business-rule, RBAC, integration and data-integrity items below were *executed live*. Items that genuinely require a human or a real gateway/browser — cross-browser, mobile/tablet rendering, screen-reader accessibility, completing a real Razorpay charge, real inbox delivery, and physical network-interruption/refresh-mid-transaction — were **reviewed at the code level and are marked "needs human verification."** They were not falsely reported as "tested."

---

## 1. Executive Summary / Overall Readiness

The enrollment **core engine is solid and production-grade**: strong server-side validation, correct RBAC, atomic/idempotent write paths, secrets encryption, a resilient external-sync pipeline (circuit-breaker + retry + dead-letter + audit), and a working end-to-end integration chain **Enrollment → Provision User (Sumago) → User account → Email**.

The main risk is **not defects in what exists, but functionality the brief assumes that does not exist**: there is **no admin endpoint to edit, update, delete, cancel, approve, or reject an enrollment**. The enrollment lifecycle is entirely payment/sync-driven.

**Readiness verdict:** ✅ **Conditionally ready** for the *as-built* scope (public enroll + admin manual/internal create + payment + Sumago sync). ⚠️ **Not ready** if the product requires admin edit/cancel/approval workflows — those must be built and tested first. A handful of low-severity hardening items (below) should be fixed before launch.

| Metric | Result |
|---|---|
| Live checks executed | **92** (73 main + 19 supplementary) |
| Passed | **78** |
| Failed (real defects) | **1** confirmed defect (HTTP 500 on bad UUID) |
| Failed (harness artifacts, re-verified PASS) | 6 (response-shape / login-limiter — re-run green) |
| Informational / observations | 7 |
| Functional gaps vs brief | **1 major** (no edit/update/delete/cancel/approve/reject) |

---

## 2. Step 1 — Data Cleanup (Executed ✅)

Ran `scripts/clear-enrollments.sql` (TRUNCATE … RESTART IDENTITY CASCADE) against the remote DB, per your "clean now, no backup" authorization.

| Table | Before | After cleanup |
|---|---|---|
| enrollments | 4 | **0** |
| payments | 4 | **0** |
| external_api_logs | 5 | **0** |
| followups / followup_notes | 2 / 0 | **0 / 0** |
| webhook_delivery / webhook_events | 3 / 0 | **0 / 0** |
| email_logs | 7 | **0** |
| sumago_users | 0 | **0** |
| audit_logs | 23 | **0** |
| *Preserved:* plans / plan_pricing / internal_plans / users / razorpay_configs | — | 1 / 4 / 2 / 11 / 2 |

Environment started clean. (Test execution then re-populated it — see §11.)

---

## 3. Test Cases Executed — Pass/Fail by Area

### 3.1 Authentication & Session
| # | Test | Expected | Result |
|---|---|---|---|
| A1–A4 | Login superadmin/admin/marketing/student | 200 + token | ✅ PASS |
| A5 | Login wrong password | 401, generic msg | ✅ PASS |
| A6 | Login non-existent user | 401, **identical** message (no user enumeration) | ✅ PASS |
| A7 | Login invalid email + short password | 400 validation | ✅ PASS |
| A8 | Protected route without token | 401 | ✅ PASS |
| A9 | Protected route malformed token | 401 | ✅ PASS |
| A10 | Login rate limit (6th attempt/min) | 429 | ✅ PASS (limiter works) |

Notes: bcrypt cost 12; refresh-token rotation **with reuse detection** (whole family revoked on replay); timing-safe dummy-hash compare on unknown users.

### 3.2 Public Website ("Enroll Now")
| # | Test | Expected | Result |
|---|---|---|---|
| B1 | Valid new-shape submit | 201 + enrollment_code | ✅ PASS |
| B2 | Immediate duplicate (same email+phone) | dedup → same id | ✅ PASS |
| B3–B10 | Negatives: digits-in-name, `<script>` name, phone leading-5, short phone, bad email, missing education, bad role enum, empty body | 400 each | ✅ PASS (all) |
| B11 | Invalid promo code | 400 PROMO_CODE_INVALID | ✅ PASS |
| B12 | SQL-injection string in name | 400 (regex blocks) | ✅ PASS |
| B13 | Legacy snake_case shape | 201 | ✅ PASS |
| B14 | Name > 100 chars | 400 | ✅ PASS |
| B15 | Unknown extra field | accepted 201 (not persisted) | ⚠️ INFO (see Bug #6) |

### 3.3 Payment / External Website Journey (live, Razorpay **test** key)
| # | Test | Expected | Result |
|---|---|---|---|
| C1 | Select plan `planPricingId` | 200 | ✅ PASS |
| C2 | Create Razorpay payment-order | 201, real order id (`order_Sz3…`) | ✅ PASS |
| C3 | Enrollment transitions → `payment_pending` | yes | ✅ PASS |
| C4 | Re-submit same email mid-flow | resume, **no duplicate** | ✅ PASS |
| C5 | Payment-verify with bad signature / unknown order | rejected (404) | ✅ PASS (see Bug #8) |
| C6 | Settled-enrollment re-enroll guard | 409 ENROLLMENT_ALREADY_EXISTS | ✅ verified in code/flow |
| — | **Complete a real paid charge** | — | 🔶 **Needs human verification** (gateway UI) |

### 3.4 Admin — Manual Enrollment
| # | Test | Expected | Result |
|---|---|---|---|
| D1/D2 | superadmin / admin create manual | 201, status `paid`, webhookOk | ✅ PASS |
| D3/D4 | marketing / student create manual | 403 (RBAC) | ✅ PASS |
| D5 | Invalid planTier | 400 | ✅ PASS |
| D6 | Invalid durationMonths (5) | 400 | ✅ PASS |
| D7 | Non-existent pricing combo (GOLD/3) | 404 PLAN_PRICING_NOT_FOUND | ✅ PASS |
| D8 | Digits in name | 400 | ✅ PASS |

### 3.5 Admin — Internal Enrollment
| # | Test | Expected | Result |
|---|---|---|---|
| E1 | Valid internal (course+plan, no coupon) | 201, `PAID`, synthetic payment row | ✅ PASS |
| E2 | Invalid coupon (empty coupons[]) | 400 COUPON_INVALID | ✅ PASS |
| E3 | Plan/course mismatch | 400 INTERNAL_PLAN_COURSE_MISMATCH | ✅ PASS |
| E4 | Non-existent internal plan | 404 INTERNAL_PLAN_NOT_FOUND | ✅ PASS |
| E5 | **Fee tampering** (send basePrice/final in body) | ignored, server re-prices from course_fee | ✅ PASS |
| E6 | marketing internal create | 403 | ✅ PASS |

### 3.6 Admin — List / Search / Detail
| # | Test | Expected | Result |
|---|---|---|---|
| F1 | List (paginated `items`) | 200, total/pagination meta | ✅ PASS |
| F2/F3 | Filter candidateType INTERNAL / EXTERNAL | only matching rows | ✅ PASS (4/4) |
| F4/F5 | Search by email / phone | matches | ✅ PASS |
| F6 | Grouped-by-email / internal-grouped | 200 | ✅ PASS |
| F7 | by-email history | 200 | ✅ PASS |
| F8 | getById (valid) | 200 + payments | ✅ PASS |
| F9 | getById non-existent UUID | 404 | ✅ PASS |
| F10 | **getById malformed UUID** | 400/404 ideally | ❌ **FAIL → 500** (Bug #1) |
| F11 | Invalid sortBy | 400 | ✅ PASS |
| F12 | Pagination limit=2 | ≤2 items | ✅ PASS |
| F13 | student list (RBAC) | 403 | ✅ PASS |

### 3.7 Follow-ups
| # | Test | Expected | Result |
|---|---|---|---|
| G1 | List follow-ups | 200 | ✅ PASS |
| G2 | `/follow-ups` hyphen alias | 200 | ✅ PASS |
| G3 | Update status invalid enum | 400 | ✅ PASS |
| G4 | Add empty note | 400 | ✅ PASS |
| G5 | Timeline of non-existent | 404 | ✅ PASS |
| G6 | Update status valid + next date | 200 | ✅ PASS |
| G7 | Add note → timeline shows 3 events | 200 | ✅ PASS |
| G8 | Close follow-up | 200 | ✅ PASS |
| G9 | Note stores raw HTML/JS | stored verbatim | ⚠️ INFO (Bug #7) |

> **Follow-up trigger:** Follow-ups are **auto-created only when an enrollment's Sumago sync hits the dead-letter queue** (`externalApi.worker → autoCreateFromDeadLetter`, idempotent). They are **not** created by enrollment or payment directly. In a clean E2E with healthy sync, zero follow-ups exist — confirmed. (Lifecycle above tested via a seeded row since no sync failed.)

### 3.8 Payments / Email Log / Provision User / Fetch Users
| # | Test | Expected | Result |
|---|---|---|---|
| H1 | List payments | 200 | ✅ PASS |
| I1 | List email logs | 200 (onboarding emails present) | ✅ PASS |
| J1 | **Provision User (POST)** — external-api-logs | 200 | ✅ PASS — all syncs **status=success, code 200** |
| J2 | Webhook deliveries | 200, ok=true ×4 | ✅ PASS |
| K1 | Sumago config | 200, enabled, beta.kommonschool.com | ✅ PASS |
| K2 | **Fetch Users (GET sumago/users)** | 200 | ✅ PASS — live sync returned **9 users** |
| K3 | marketing fetch users (RBAC) | 403 (no WEBHOOKS_VIEW) | ✅ PASS |
| K4 | fetch users without token | 401 | ✅ PASS |

### 3.9 Security / RBAC
| # | Test | Expected | Result |
|---|---|---|---|
| L1 | SQLi in `search` param | 200, safe (Prisma parameterized) | ✅ PASS |
| L2 | admin/users list — superadmin | 200 | ✅ PASS |
| L3 | admin/users list — marketing / student | 403 | ✅ PASS |
| L4 | student self-account `/auth/me/account` | 200, **only own** data (self-scoped by token) | ✅ PASS |

---

## 4. Bugs Identified (with Severity & Priority)

| # | Defect | Sev | Pri | Evidence | Recommendation |
|---|---|---|---|---|---|
| **1** | **Malformed UUID → HTTP 500 INTERNAL_ERROR** on `GET /admin/enrollments/:id` (and public `GET /enrollments/:id`). No UUID param validation; bad id reaches Prisma and throws. | **Low** | **Med** | `adminEnrollment.controller.js:145` passes `req.params.id` raw; `not-a-uuid` → 500. | Add `validate(idParamSchema,'params')` (a UUID schema already exists in `plan.validator.js`). Return 400/404. |
| **2** | **No admin edit / update / delete / cancel / approve / reject enrollment endpoints.** Only `PATCH /:id/plan` (public) + `retry-sync` exist. | **Med-High** | **High** | Backend routes & `adminService.js` expose list/detail/grouped/by-email/retry-sync only. | Decide product intent; build + test edit/cancel/status-override if required by the business. |
| **3** | **Permissive CORS** — `origin: cb(null,true)` reflects *any* Origin with `credentials:true`. | **Med** | **Med** | `app.js:61-86`. Bearer-token auth lowers risk (no cookies), but it's still over-broad. | Restrict to an explicit allowlist of known frontends. |
| **4** | **Login limiter counts successful logins** (5/min/IP). Multiple admins behind one office/NAT IP can lock each other out. | **Low** | **Low-Med** | `rateLimit.middleware.js:28`. `trust proxy=1` set, so it's per real IP. | Key the limiter on email+IP, or only count failures. |
| **5** | Public enrollment **list status filter omits `sync_pending`** (valid enum value). Filtering by it → 400. | **Low** | **Low** | `enrollment.validator.js:141`. | Add `sync_pending` to the allowed list. |
| **6** | Public enrollment POST **accepts unknown extra fields** (HTTP 201). Not persisted, but lax. | **Low** | **Low** | Test B15 returned 201 with `hackerField`. | Set `stripUnknown`/`forbidUnknown` on the public create schema. |
| **7** | **Stored-XSS exposure surface:** follow-up `note.body` / `reason` and other free-text are stored **verbatim**. Identity fields (name/email/phone) are regex-guarded, but notes are not. Safety depends entirely on frontend escaping. | **Med (if FE unescaped)** | **Med** | Test G9 stored `<img src=x onerror=…>`. | Confirm React auto-escapes everywhere these render (avoid `dangerouslySetInnerHTML`); optionally sanitize on write. |
| **8** | `payment-verify` returns **404 for an unknown order** rather than a distinct "signature invalid" 4xx. Acceptable but ambiguous. | **Low** | **Low** | Test C5. | Distinguish "order not found" (404) vs "signature mismatch" (400). |

No **Critical/Blocker** defects were found in the implemented scope.

---

## 5. Validation Testing — Result
**Server-side validation is authoritative and strong (Joi).** Verified live: required fields, max/min length, data-type, enum membership, special-char rejection, Indian-mobile format (`^[6-9]\d{9}$`), strict email regex (rejects 1-char TLD), name = letters+spaces only (blocks digits, symbols, `<script>`), promo-code re-validation, ISO date validation on filters. **Result: PASS** (minor gaps = Bugs #5, #6).

## 6. UI/UX Testing — Status
🔶 **Needs human verification.** Cannot be honestly asserted by an API/agent test: page responsiveness, mobile/tablet rendering, cross-browser, form usability, navigation flow. *Code-level positives:* clear error-code contract (`error.code` + message), success/`message` envelopes, `react-hot-toast` for feedback. **Recommend** a manual pass on Chrome/Firefox/Safari/Edge + iOS/Android viewports, and an axe/Lighthouse accessibility audit (keyboard nav, labels, contrast, ARIA).

## 7. API Testing — Result
**PASS.** Consistent `{success, data|error{code,message}}` envelope, correct HTTP codes (200/201/400/401/403/404/429/500-on-bug#1), pagination metadata (`total/page/limit/totalPages/hasNext/hasPrev`), filtering, search (trigram-aware ≥3 chars, numeric phone prefix), grouping (window functions). Provision-User (POST) and Fetch-Users (GET) integrations both return live success.

## 8. Security Concerns — Result
**Strong baseline.** ✅ RBAC enforced per-route (superadmin 28 / admin 24 / marketing 6 perms) and verified for all 4 roles; ✅ no user enumeration; ✅ refresh rotation + reuse detection; ✅ SQLi-safe (Prisma parameterized, tested); ✅ secrets AES-256-GCM encrypted, live Razorpay key kept inactive; ✅ Helmet, `x-powered-by` off, `trust proxy`; ✅ fee-tampering blocked server-side; ✅ self-scoped account endpoint. **Harden:** CORS (Bug #3), stored-XSS frontend-escaping confirmation (Bug #7), login-limiter keying (Bug #4). No CSRF tokens — acceptable for a Bearer-token API.

## 9. Data Integrity — Result
**PASS.** Idempotency everywhere it matters: unique `payments.razorpay_order_id`, unique `webhook_events.event_id`, 5-minute dedupe, partial-unique index for one active draft/email, `FOR UPDATE` row locks on the upsert + coupon paths (atomic `usedCount`). FK `onDelete: Restrict` on payments/logs/followups → children can't be orphaned. Coupon/price **snapshots** freeze history. Money stored in paise (integers) — no float drift. Soft-delete columns present.

## 10. Integration Testing — Result
**PASS (live).** Verified data consistency across the chain:
- **Enrollment → Provision User (Sumago POST):** 4/4 `external_api_logs` = success, HTTP 200 to `https://beta.kommonschool.com/integrations/provision-user`.
- **Enrollment → User Provisioning → Email:** admin-created paid enrollments produced new student `users` (11→19 incl. 4 QA) + onboarding `email_logs` = `sent`.
- **Admin webhook delivery:** 4/4 ok, 200.
- **User Provisioning → Fetch Users (GET):** live Sumago sync returned 9 mirror users.
- **Enrollment → Payment:** internal-flow synthetic payments created; manual flow correctly creates none; getById returns payment history.
- **Enrollment → Follow-up:** wired via dead-letter only (no failures occurred → 0 auto-created, by design).

## 11. Edge Cases — Result / Status
✅ Tested live: duplicate/double-submit (deduped), concurrent-safe upsert (row-locked, code-verified), oversized payload, malformed input, mid-flow re-submit (resume not dup). 🔶 **Needs human verification:** real network interruption, browser refresh mid-payment, payment-gateway timeout, true high-volume/load (a load test, e.g. k6/Artillery, is recommended).

---

## 12. Recommendations (priority order)
1. **Decide & build the missing admin lifecycle actions** (edit / cancel / delete / approve-reject / manual status) if the business needs them — currently absent (Bug #2).
2. **Add UUID param validation** on `:id` routes to kill the 500 (Bug #1) — quick win.
3. **Lock down CORS** to a frontend allowlist (Bug #3).
4. **Confirm frontend output-escaping** for all free-text (notes/reason) and add server-side sanitization (Bug #7).
5. **Tune the login limiter** (count failures / key by email) (Bug #4); add `sync_pending` + `stripUnknown` (Bugs #5/#6).
6. **Human passes:** cross-browser + mobile/tablet + accessibility; one **real Razorpay** end-to-end charge in test mode; a **load/soak test**; chaos test (kill Sumago URL → confirm dead-letter → follow-up auto-creation → admin retry-sync recovery).

## 13. Overall System Readiness Assessment
**Engineering quality of the implemented enrollment pipeline is high and largely production-ready.** The blocking question is **product scope**, not stability: if admin edit/cancel/approval workflows are in-scope, the system is **incomplete**; if the as-built create+pay+sync scope is the target, it is **ready after the low-effort hardening fixes (#1, #3, #4–#6) and the required human verification passes (UI/UX, accessibility, one real charge, load test).**

---
### Appendix — Test Artifacts (in `backend/scripts/`)
- `qa-counts.js` — table row counter (before/after)
- `qa-setup-users.js` — created QA test users (`qa.{superadmin,admin,marketing,student}@kommontest.com`, pw `QaTest@12345`)
- `qa-e2e.js` — main harness (73 checks)
- `qa-e2e2.js` — supplementary harness (19 checks)

> **Cleanup note:** Testing re-populated the DB (8 enrollments, 3 payments, 1 follow-up, etc.) and added 4 QA users + 4 onboarded student users. Tell me if you want me to (a) re-run `clear-enrollments.sql` to reset, and/or (b) remove the QA test users and helper scripts.
