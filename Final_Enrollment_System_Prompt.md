# MASTER PROMPT — Production-Grade Student Enrollment System (End-to-End)

> **Role for Claude:** You are a Principal Software Architect and Senior Full-Stack Engineer with 15+ years of experience building scalable fintech, edtech, and payment-integrated SaaS systems. You write production-grade code only — no pseudo code, no placeholders, no "TODO" comments, no truncated examples.

---

## 0. CRITICAL EXECUTION RULES (READ FIRST)

1. **Do NOT redesign the existing React frontend.** Reuse existing components, layouts, and styles. Extend only where required.
2. **Build the backend completely from scratch** using the stack defined below.
3. **Every file you generate must be complete and runnable.** No `// ... rest of code` or `/* implementation here */`.
4. **Every edge case listed in Section 14 must be explicitly handled in code** — not just acknowledged.
5. **Every API must have:** request DTO validation, response schema, error handling, status codes, logging, and RBAC enforcement.
6. **Every database write that touches multiple tables MUST use a Prisma transaction.**
7. **Every external call (Razorpay, third-party API) MUST be idempotent, retry-safe, and logged.**
8. **Output code in this strict order:** Architecture → DB Schema → Prisma → Folder Structure → Backend → Razorpay → Webhooks → Queues/Crons → RBAC → Admin APIs → Marketing APIs → Frontend Integration → Deployment.

---

## 1. SYSTEM CONTEXT

Build a **complete, scalable, fault-tolerant Student Enrollment & Payment Platform** with:

- Public student enrollment + Razorpay payment
- Admin panel for monitoring enrollments, payments, API logs
- Marketing panel for follow-up management on failed/pending payments
- Webhook-driven payment reconciliation
- Cron + queue-based retry pipelines for failed external API syncs
- Multi-Razorpay-config support (SuperAdmin can switch active gateway credentials)

---

## 2. MANDATORY TECH STACK

### Frontend (extend existing project — do NOT rebuild)
- React.js (existing)
- Axios (centralized API client with interceptors)
- TanStack Query v5 (server state)
- React Hook Form + Zod (form validation)
- Redux Toolkit (auth/global state) OR Context API
- React Router v6 with role-based protected routes
- Razorpay Checkout JS SDK

### Backend (build from scratch)
- Node.js 20 LTS
- Express.js 4.x
- **PostgreSQL 15+** (NOT MongoDB)
- **Prisma ORM** (preferred over Sequelize)
- JWT (access + refresh token rotation)
- BullMQ + Redis (queues + scheduled jobs)
- node-cron (scheduled reconciliation)
- Winston (structured JSON logging) + daily rotate
- Joi or Zod (request validation)
- Helmet, CORS, express-rate-limit, compression, hpp, xss-clean
- Razorpay Node SDK
- Axios (with retry-axios for external API)

### DevOps
- PM2 ecosystem config (cluster mode, log rotation, max-memory restart)
- `.env.example` with every variable documented
- Migration scripts via `prisma migrate`
- Health check endpoint `/health` + `/ready`
- `systemd` unit file (optional) for Redis/Postgres if self-hosted on VM
- Nginx reverse proxy config sample (TLS, gzip, rate-limit zone)

---

## 3. DATABASE CONFIGURATION (HARDCODED REQUIREMENT)

```env
PG_HOST=13.48.254.211
PG_PORT=5432
PG_USER=dev
PG_PASSWORD=$jfu6daky
PG_DB=kommon
DATABASE_URL=postgresql://dev:%24jfu6daky@13.48.254.211:5432/kommon?schema=public&connection_limit=20&pool_timeout=20
```

> **NOTE:** The `$` in the password must be URL-encoded as `%24` inside `DATABASE_URL`.
> Use `connection_limit=20` and `pool_timeout=20` for connection pooling.

---

## 4. POSTGRESQL SCHEMA REQUIREMENTS

Design **fully normalized relational schema** with these tables. Provide both raw SQL DDL and Prisma schema:

| Table | Purpose |
|---|---|
| `users` | Admin/Marketing/SuperAdmin accounts |
| `roles` | Role master (superadmin, admin, marketing) |
| `permissions` | Granular permission master |
| `role_permissions` | Many-to-many roles↔permissions |
| `refresh_tokens` | JWT refresh token rotation + revocation |
| `enrollments` | Student enrollment records |
| `payments` | Razorpay payment records (1 enrollment → many retry payments) |
| `razorpay_configurations` | Multiple Razorpay key sets (only one active at a time) |
| `webhook_events` | Raw webhook payloads + idempotency tracking |
| `external_api_logs` | Every call to the external sync API (request + response + retry count) |
| `followups` | Follow-up lifecycle for a student |
| `followup_notes` | Append-only notes/timeline per follow-up |
| `audit_logs` | Who did what, when, on which entity |

### Schema Rules (mandatory)
- **UUID v4 primary keys** on all tables (`gen_random_uuid()`)
- `created_at`, `updated_at` (with auto-update trigger), `deleted_at` (soft delete)
- **Foreign keys with `ON DELETE RESTRICT`** for financial records, `CASCADE` only for child notes/logs
- **Composite indexes** on:
  - `enrollments(email, phone_number)`
  - `payments(enrollment_id, status)`
  - `payments(razorpay_order_id)` UNIQUE
  - `webhook_events(event_id)` UNIQUE (idempotency key)
  - `external_api_logs(enrollment_id, status)`
  - `followups(assigned_to, status, next_followup_date)`
- **Enums** as PostgreSQL native enums:
  - `payment_status`: initiated, pending, success, failed, cancelled, expired, refunded
  - `enrollment_status`: draft, submitted, payment_pending, paid, sync_pending, completed, failed
  - `external_api_status`: pending, processing, success, failed, retrying, dead_letter
  - `followup_status`: payment_pending, call_back_later, interested, not_interested, payment_completed, followup_closed, invalid_number, no_response
- **CHECK constraints** on amounts (`amount > 0`), email format, phone format
- **Partial indexes** on `WHERE deleted_at IS NULL`

---

## 5. BACKEND FOLDER STRUCTURE (mandatory)

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js               # validated env loader (Joi schema)
│   │   ├── database.js          # Prisma client singleton
│   │   ├── redis.js             # ioredis singleton
│   │   ├── logger.js            # Winston with daily rotate
│   │   └── constants.js
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   ├── auth.validator.js
│   │   │   └── auth.routes.js
│   │   ├── users/
│   │   ├── enrollments/
│   │   ├── payments/
│   │   ├── razorpay/
│   │   │   ├── razorpay.service.js     # SDK wrapper, signature verify
│   │   │   ├── razorpay.config.service.js
│   │   │   └── webhook.controller.js
│   │   ├── externalApi/
│   │   │   ├── external.service.js
│   │   │   └── external.retry.handler.js
│   │   ├── followups/
│   │   ├── admin/
│   │   └── reports/
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT verify
│   │   ├── rbac.middleware.js          # role + permission check
│   │   ├── validate.middleware.js      # Joi/Zod validator
│   │   ├── errorHandler.middleware.js  # centralized async error
│   │   ├── rateLimit.middleware.js
│   │   ├── requestLogger.middleware.js
│   │   └── webhookRaw.middleware.js    # preserve raw body for signature
│   ├── jobs/
│   │   ├── paymentReconciliation.job.js
│   │   ├── externalApiRetry.job.js
│   │   ├── webhookRetry.job.js
│   │   ├── enrollmentCleanup.job.js
│   │   ├── followupReminder.job.js
│   │   └── index.js                    # cron registry
│   ├── queues/
│   │   ├── connection.js
│   │   ├── externalApi.queue.js
│   │   ├── webhook.queue.js
│   │   ├── workers/
│   │   │   ├── externalApi.worker.js
│   │   │   └── webhook.worker.js
│   │   └── index.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── pagination.js
│   │   ├── crypto.js                   # HMAC, hashing
│   │   └── retry.js                    # exponential backoff
│   ├── validators/
│   ├── docs/
│   │   └── openapi.yaml
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── app.js                          # express app
│   └── server.js                       # http server + graceful shutdown
├── logs/
├── .env.example
├── ecosystem.config.js                 # PM2
├── nginx.conf.sample                   # reverse proxy reference
├── package.json
└── README.md
```

---

## 6. AUTHENTICATION & RBAC (must be implemented exactly)

### JWT Flow
- Access token: 15 minutes, signed RS256 (public/private key pair)
- Refresh token: 7 days, stored hashed (bcrypt) in `refresh_tokens` table
- Refresh token rotation on every use; old token revoked
- Logout revokes all refresh tokens for user
- Token reuse detection → revoke entire family

### Roles
| Role | Permissions |
|---|---|
| **superadmin** | full system, manage Razorpay configs, manage admins, switch gateway, view all reports |
| **admin** | view enrollments/payments/API logs/reports (read-mostly) |
| **marketing** | view failed/pending enrollments, manage follow-ups, trigger payment retry, add notes |

### Middleware
- `authenticate` → verifies JWT, loads user
- `authorize(['admin','superadmin'])` → role check
- `hasPermission('payments:retry')` → granular permission check

---

## 7. ENROLLMENT + PAYMENT FLOW (must be implemented exactly)

```
Student Form
  → POST /api/v1/enrollments              (creates enrollment, status=submitted)
  → POST /api/v1/payments/create-order    (creates Razorpay order, status=initiated)
  → Frontend opens Razorpay Checkout
  → On success handler: POST /api/v1/payments/verify  (signature verify, status=success)
  → Enqueue external-api-sync job (BullMQ)
  → Worker calls external API → on success status=completed
  → On any failure → push to retry queue with exponential backoff
                  → after N retries → dead_letter → marketing follow-up auto-created

Webhook (parallel path):
  → POST /api/v1/webhooks/razorpay
  → Verify signature, idempotency check on event_id
  → Update payment status (race-safe with verify endpoint via SELECT FOR UPDATE)
```

### Payment State Machine (enforce in service layer)
```
initiated → pending → success → (sync_pending → completed)
        ↘        ↘ failed → (retry path or marketing followup)
         ↘ cancelled
          ↘ expired
```

---

## 8. RAZORPAY INTEGRATION (must be implemented exactly)

- **Multi-config support:** `razorpay_configurations` table holds many key sets, only one with `is_active=true`. SuperAdmin can switch.
- **Order creation:** `amount` in paise, `currency=INR`, receipt = `enrollmentId`, notes carry enrollment metadata.
- **Signature verification (verify endpoint):**
  ```
  HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret) === razorpay_signature
  ```
- **Webhook signature verification:** raw body required, header `x-razorpay-signature`.
- **Events to handle:** `payment.captured`, `payment.failed`, `payment.authorized`, `order.paid`, `refund.processed`.
- **Idempotency:** `event_id` UNIQUE on `webhook_events`. If duplicate → return 200 immediately, do not reprocess.
- **Race condition between verify endpoint + webhook:** use Postgres advisory lock (`pg_advisory_xact_lock`) keyed on `payment.id` OR `SELECT ... FOR UPDATE`.

---

## 9. EXTERNAL API SYNC (CALL ONLY AFTER VERIFIED PAYMENT)

```
POST https://webhook.site/8012a95d-2521-4b64-b59f-1cbf3bd5e6e0
Headers:
  Authorization: Bearer <token from env>
  Content-Type: application/json
  X-Idempotency-Key: <enrollment_id>          # mandatory custom header
Body: { firstName, lastName, email, phoneNumber, plan, group, unit, phase, segment, transactionId, amount }
```

### Retry Policy (BullMQ)
- attempts: 5
- backoff: exponential, starting 30s, factor 2, cap 30min
- removeOnComplete: 1000 jobs
- removeOnFail: false (keep for forensics, move to dead-letter after attempts exhausted)
- Per-error handling:
  - `400/422` → no retry, mark `failed`, raise audit log
  - `401` → refresh token then retry once; if still 401 → mark `failed`
  - `409` → treat as success (already synced)
  - `429` → respect `Retry-After` header
  - `5xx` / network / timeout → standard retry
- Every attempt logged to `external_api_logs` with full request/response, status code, duration_ms

---

## 10. CRON JOBS (node-cron schedules + BullMQ workers)

| Job | Schedule | Purpose |
|---|---|---|
| Payment reconciliation | `*/5 * * * *` | Fetch payments stuck in `pending > 10min`, query Razorpay API, reconcile |
| External API retry sweeper | `*/2 * * * *` | Pick `external_api_status=retrying` rows whose `next_attempt_at <= NOW()`, enqueue |
| Expired enrollment cleanup | `0 2 * * *` | Mark `submitted` enrollments older than 24h with no payment as `expired` |
| Webhook retry processor | `*/3 * * * *` | Replay webhook_events with `processed=false AND attempts<5` |
| Follow-up reminders | `0 9 * * *` | Notify marketing of follow-ups due today |
| Refresh token cleanup | `0 3 * * *` | Delete expired/revoked refresh tokens older than 30 days |

All jobs must:
- acquire a distributed lock (Redis SETNX with TTL) to prevent multi-instance double execution
- log start/end with duration
- emit metrics (count processed, count failed)

---

## 11. EDGE CASES — EVERY ONE MUST BE EXPLICITLY HANDLED IN CODE

For each edge case below, explain in a comment in the relevant file how it is handled:

1. ✅ Payment success but external API fails → enrollment stays `paid`, sync goes to retry queue, marketing follow-up auto-created after dead-letter
2. ✅ External API success but DB update fails → wrap in transaction; if commit fails, retry idempotent (X-Idempotency-Key prevents duplicate)
3. ✅ Duplicate webhook events → UNIQUE constraint on `event_id` + early return 200
4. ✅ Duplicate payment (user double-clicks) → DB UNIQUE on `razorpay_order_id`; idempotent verify endpoint
5. ✅ Webhook arrives before frontend verify call → both paths converge via `SELECT FOR UPDATE` on payment row; whichever lands first wins, second is no-op
6. ✅ User refreshes during payment → on next load, frontend calls `GET /payments/by-enrollment/:id` to resume state
7. ✅ Payment captured but frontend never returned → webhook reconciles independently; cron sweeper catches stragglers
8. ✅ Razorpay downtime → circuit breaker (opossum); fallback to "try again later" UI; queued retry
9. ✅ Token expiration on external API → auto-refresh once, re-enqueue
10. ✅ Concurrent enrollment submissions same email → application-level dedupe (find existing draft within 5 min) + DB partial unique index
11. ✅ Retry storms → BullMQ `limiter: { max: 50, duration: 1000 }` per queue
12. ✅ Partial payment / amount mismatch → reject in verify endpoint, mark `failed`, log discrepancy
13. ✅ Network failure mid-transaction → Prisma `$transaction` with timeout; outer try/catch; idempotency keys
14. ✅ Marketing retries payment for completed enrollment → service-layer guard rejects with 409
15. ✅ Razorpay key rotation mid-flight → payment record stores `razorpay_config_id` so verification uses the correct key
16. ✅ Clock skew between server and Razorpay → tolerate ±5min on webhook timestamps
17. ✅ Database deadlock → catch SQLSTATE 40P01, retry transaction up to 3 times with jitter

---

## 12. API SURFACE (deliver complete, documented)

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/me`

### Enrollments
- `POST /api/v1/enrollments`               (public)
- `GET  /api/v1/enrollments/:id`           (admin/marketing)
- `GET  /api/v1/enrollments`               (admin, paginated, filterable)

### Payments
- `POST /api/v1/payments/create-order`     (public, requires enrollmentId)
- `POST /api/v1/payments/verify`           (public)
- `GET  /api/v1/payments/by-enrollment/:enrollmentId`
- `GET  /api/v1/payments`                  (admin, paginated)
- `POST /api/v1/payments/:id/retry`        (marketing)

### Webhooks
- `POST /api/v1/webhooks/razorpay`         (raw body, signature-verified)

### Follow-ups
- `GET  /api/v1/followups`                 (marketing)
- `POST /api/v1/followups/:id/notes`
- `PATCH /api/v1/followups/:id/status`
- `GET  /api/v1/followups/:id/timeline`

### Razorpay Configs (superadmin only)
- `GET    /api/v1/razorpay-configs`
- `POST   /api/v1/razorpay-configs`
- `PATCH  /api/v1/razorpay-configs/:id/activate`
- `DELETE /api/v1/razorpay-configs/:id`

### Reports
- `GET /api/v1/reports/payments-summary`
- `GET /api/v1/reports/enrollments-funnel`
- `GET /api/v1/reports/external-api-health`
- `GET /api/v1/reports/export?type=payments&format=csv`

**Every list endpoint supports:** `page`, `limit`, `sortBy`, `sortOrder`, `search`, `status`, `dateFrom`, `dateTo`. Server-side pagination uses keyset pagination for >10k rows.

**Every response follows:**
```json
{ "success": true, "data": {...}, "meta": { "page":1, "limit":20, "total":150 }, "message": "..." }
```

**Every error follows:**
```json
{ "success": false, "error": { "code":"VALIDATION_ERROR", "message":"...", "details":[...] }, "traceId":"..." }
```

---

## 13. FRONTEND DELIVERABLES (extend existing — do not rebuild)

1. **`src/api/axiosClient.js`** — interceptors (auth header, refresh on 401, traceId, error normalization)
2. **`src/api/services/`** — `enrollment.service.js`, `payment.service.js`, `auth.service.js`, `followup.service.js`, `admin.service.js`
3. **`src/hooks/`** — `useEnrollment`, `useRazorpayPayment`, `useAuth`, `useFollowups`, `usePagination`
4. **`src/contexts/AuthContext.jsx`** OR Redux slice
5. **`src/routes/ProtectedRoute.jsx`** — role-aware route guard
6. **`src/utils/razorpay.js`** — script loader, checkout opener, callback wiring
7. **Form integration** — wire existing enrollment form to `useEnrollment` + `useRazorpayPayment` hooks
8. **Admin tables** — bind to existing UI tables, add server-side pagination/filtering/sorting via TanStack Query
9. **Marketing follow-up UI** — bind to existing screens, add timeline component, status update modal, retry button

> **STRICT:** Do not modify existing layouts, theme, color palette, or component structure. Only add data-binding logic, hooks, and service calls.

---

## 14. SECURITY CHECKLIST (must all be implemented)

- [ ] Helmet with CSP
- [ ] CORS whitelist from env
- [ ] Rate limit: global 100/min, login 5/min, webhook unlimited but signature-gated
- [ ] Input sanitization (xss-clean, hpp)
- [ ] Parameterized Prisma queries (no raw SQL with interpolation)
- [ ] Bcrypt cost factor 12 for passwords
- [ ] JWT RS256 with key rotation support
- [ ] Refresh token rotation + reuse detection
- [ ] Webhook signature verification (timing-safe compare)
- [ ] Audit log on every privileged action
- [ ] PII in logs masked (email partially, phone last 4 only)
- [ ] Razorpay secrets encrypted at rest in DB (AES-256-GCM with KMS-style key from env)
- [ ] HTTPS only in production (HSTS)
- [ ] Graceful shutdown: drain HTTP, close BullMQ workers, close Prisma, then exit

---

## 15. LOGGING & OBSERVABILITY

- Winston with daily-rotate-file, JSON format
- Each request gets a `traceId` (uuid) propagated to all logs and external calls
- Separate streams: `app.log`, `error.log`, `payment.log`, `webhook.log`, `cron.log`, `external-api.log`
- Health endpoint `/health` (liveness) and `/ready` (DB + Redis ping)
- Optional: Prometheus `/metrics` with prom-client

---

## 16. DEPLOYMENT (PM2 + native, no containers)

- Provide `ecosystem.config.js` (PM2 cluster mode, instances=`max`, max_memory_restart=`512M`, log paths, env_production block, exec_mode=`cluster`)
- Provide `.env.example` with EVERY variable, grouped and commented (DB, Redis, JWT keys, Razorpay, External API, Logging, CORS, Rate limits)
- Provide `nginx.conf.sample` showing reverse proxy to PM2, TLS termination, gzip, client_max_body_size, webhook path with raw body preserved
- Provide `README.md` with: Node 20 install, PostgreSQL 15 + Redis 7 install commands (Ubuntu 22.04), git clone → `npm ci` → `npx prisma migrate deploy` → `npx prisma db seed` → `pm2 start ecosystem.config.js --env production` → `pm2 save` → `pm2 startup`
- Provide migration commands: `npx prisma migrate dev`, `npx prisma migrate deploy`, `npx prisma db seed`
- Provide PM2 operational commands: `pm2 logs`, `pm2 reload api`, `pm2 monit`, `pm2 flush`
- Provide log rotation: `pm2 install pm2-logrotate` with size + retention config
- Graceful shutdown verified: PM2 sends SIGINT, app drains HTTP server, closes BullMQ workers, closes Prisma, exits within `kill_timeout` (default 1600ms — bump to 10000ms in ecosystem config)

---

## 17. OUTPUT FORMAT (follow strictly)

Generate the implementation in this exact order, with each section as a clearly labeled block of complete, runnable files:

1. **System Architecture Diagram** (ASCII or mermaid)
2. **PostgreSQL Schema** (complete SQL DDL with indexes, enums, triggers)
3. **Prisma Schema** (`schema.prisma` — full)
4. **Backend Folder Structure** (tree)
5. **Backend Implementation** — every file from Section 5, in full
6. **Razorpay Integration** — service, controller, signature verification
7. **Webhook Handler** — raw body middleware, idempotency, processor
8. **Queues + Workers + Cron Jobs** — full BullMQ setup
9. **RBAC Middleware + Seed Data** — roles, permissions seeded
10. **Admin APIs** — list/detail/export endpoints with pagination
11. **Marketing Follow-up Module** — full CRUD + timeline
12. **Frontend Integration Files** — services, hooks, axios client, Razorpay loader, ProtectedRoute
13. **Deployment Bundle** — ecosystem.config.js (PM2), nginx.conf.sample, .env.example, README.md (with full Node/Postgres/Redis/PM2 setup commands)

---

## 18. ACCEPTANCE CRITERIA (your output is rejected if any of these fail)

- [ ] Backend starts cleanly with `npm install && npx prisma migrate deploy && npm start`
- [ ] All 11 tables created with correct relations and indexes
- [ ] Enrollment → Razorpay order → verify → external API call works end-to-end
- [ ] Webhook endpoint verifies signature, is idempotent, handles all 5 events
- [ ] External API failure triggers retry queue, eventually creates marketing follow-up after dead-letter
- [ ] All 17 edge cases from Section 11 are addressed in code with comments
- [ ] SuperAdmin can add a new Razorpay config and switch active gateway without restart
- [ ] Marketing user can list failed enrollments, add notes, update status, trigger retry
- [ ] All endpoints enforce RBAC; unauthorized returns 403 with proper error envelope
- [ ] Logs are structured JSON, rotated daily, with traceId
- [ ] `pm2 start ecosystem.config.js --env production` brings up the API in cluster mode and survives `pm2 reload api` with zero downtime
- [ ] No hardcoded secrets; all from env
- [ ] No `TODO`, `FIXME`, `... rest of code`, or placeholder comments

---

## 19. BEGIN

Now generate the complete implementation following Sections 1–18 exactly. Start with Section 17.1 (Architecture Diagram) and proceed in order through 17.13. Do not skip, do not summarize, do not abbreviate. Every file you produce must be complete and production-ready.

If the response would be too long for one message, split across multiple messages but keep the order intact and announce: `--- CONTINUED IN NEXT MESSAGE ---` at split points. Resume exactly where you left off.
