# Internal Plans API Contract

**Base URL:** `{{BASE_URL}}/api/v1`  
**Auth:** All admin endpoints require `Authorization: Bearer <token>` header.  
**Response envelope:** Every response wraps in `{ success: boolean, data: any, meta?: object }`.  
**Error envelope:** `{ success: false, error: { code: string, message: string, details?: any } }`.

---

## Enums

### Duration
```
1_MONTH | 3_MONTHS | 6_MONTHS | 12_MONTHS
```

### PlanStatus
```
ACTIVE | INACTIVE
```

### CouponDiscountType
```
PERCENT | FLAT
```

### CouponStatus
```
ACTIVE | INACTIVE
```

---

## Data Shapes

### InternalPlan
```json
{
  "id":          1,
  "refId":       "iplan_8f3a9b21-7c4d-4e25-b6a1-0f8d2c3e4abc",
  "name":        "Data Science — 6 Month Intensive",
  "duration":    "6_MONTHS",
  "description": "Comprehensive 6-month data science programme.",
  "courseId":    1,
  "status":      "ACTIVE",
  "coupons":     [ <Coupon>, ... ],
  "createdAt":   "2026-01-01T00:00:00.000Z",
  "updatedAt":   "2026-01-01T00:00:00.000Z"
}
```

> `refId` is an opaque, server-generated random identifier (UUID-based) assigned
> at create time and never mutated. It is the value forwarded to webhook
> subscribers — external systems should key on `refId`, not the numeric `id`.

> **Note:** `InternalPlan` does NOT carry its own `price`. The plan's price is
> always the linked `Course.courseFee`. For coupon validation and fee
> calculation, the client must supply `basePrice` (the linked course's
> `courseFee`) in the request body.

### Coupon (embedded in InternalPlan)
```json
{
  "id":            1,
  "code":          "WELCOME10",
  "discountType":  "PERCENT",
  "discountValue": 10,
  "expiryDate":    "2027-12-31",
  "usageLimit":    100,
  "usedCount":     5,
  "status":        "ACTIVE"
}
```

### PaginationMeta
```json
{
  "page":       1,
  "limit":      10,
  "total":      42,
  "totalPages": 5
}
```

---

## Endpoints

### 1. List Internal Plans

**GET** `/admin/internal-plans`

**Query parameters:**

| Param     | Type    | Required | Description                                |
|-----------|---------|----------|--------------------------------------------|
| page      | integer | No       | Page number (default: 1)                   |
| limit     | integer | No       | Items per page (default: 10, max: 100)     |
| search    | string  | No       | Case-insensitive name search               |
| courseId  | integer | No       | Filter by course FK                        |
| status    | string  | No       | `ACTIVE` or `INACTIVE` (omit for all)      |

**Success 200:**
```json
{
  "success": true,
  "data":    [ <InternalPlan>, ... ],
  "meta":    { "page": 1, "limit": 10, "total": 3, "totalPages": 1 }
}
```

---

### 2. Get Internal Plan by ID

**GET** `/admin/internal-plans/:id`

**Success 200:**
```json
{ "success": true, "data": <InternalPlan> }
```

**Error 404:**
```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Internal plan 99 not found" } }
```

---

### 3. Create Internal Plan

**POST** `/admin/internal-plans`

**Request body:**
```json
{
  "name":        "string (2–200 chars, required)",
  "duration":    "1_MONTH | 3_MONTHS | 6_MONTHS | 12_MONTHS (required)",
  "description": "string (optional, max 2000 chars)",
  "courseId":    1,
  "status":      "ACTIVE | INACTIVE (default: ACTIVE)",
  "coupons": [
    {
      "code":          "WELCOME10",
      "discountType":  "PERCENT | FLAT",
      "discountValue": 10,
      "expiryDate":    "2027-12-31",
      "usageLimit":    100,
      "status":        "ACTIVE | INACTIVE"
    }
  ]
}
```

> `price` is intentionally absent — the plan inherits it from `Course.courseFee`.

**Validation rules:**
- `name`: required, 2–200 characters
- `duration`: required, must be one of the Duration enum values
- `courseId`: required, must reference an existing Course
- `description`: optional, max 2000 characters
- `coupons[].code`: required if coupon present, max 50 chars
- `coupons[].discountType`: required, `PERCENT` or `FLAT`
- `coupons[].discountValue`: required, positive number; if `PERCENT` must be ≤ 100
- `coupons[].expiryDate`: optional, ISO date string `YYYY-MM-DD`
- `coupons[].usageLimit`: optional, positive integer
- `coupons[].status`: optional, default `ACTIVE`

**Success 201:**
```json
{ "success": true, "data": <InternalPlan> }
```

**Error 400:**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

---

### 4. Update Internal Plan

**PATCH** `/admin/internal-plans/:id`

**Request body:** Same as Create but all fields optional. Coupons array replaces existing coupons.

**Success 200:**
```json
{ "success": true, "data": <InternalPlan> }
```

**Error 404:** Same as Get.

---

### 5. Set Plan Status

**PATCH** `/admin/internal-plans/:id/status`

**Request body:**
```json
{ "status": "ACTIVE | INACTIVE" }
```

**Success 200:**
```json
{ "success": true, "data": <InternalPlan> }
```

---

### 6. Delete Internal Plan

**DELETE** `/admin/internal-plans/:id`

**Success 204:** No body.

**Error 404:** Same as Get.

**Error 409:**
```json
{ "success": false, "error": { "code": "PLAN_IN_USE", "message": "Cannot delete a plan with existing enrollments" } }
```

---

### 7. List Plans by Course (for dropdowns)

**GET** `/admin/internal-plans/by-course/:courseId`

Returns only ACTIVE plans for the given course. No pagination.

**Success 200:**
```json
{ "success": true, "data": [ <InternalPlan>, ... ] }
```

---

### 8. Validate Coupon

**POST** `/admin/internal-plans/validate-coupon`

**Request body:**
```json
{
  "code":           "WELCOME10",
  "internalPlanId": 1,
  "basePrice":      49999
}
```

`basePrice` is the linked course's `courseFee` (rupees). Required, since `InternalPlan` no longer stores its own price.

**Success 200:**
```json
{
  "success": true,
  "data": {
    "valid":          true,
    "discountAmount": 5000,
    "finalAmount":    44999,
    "coupon": { ...CouponObject }
  }
}
```

**If invalid:**
```json
{
  "success": true,
  "data": {
    "valid":          false,
    "discountAmount": 0,
    "finalAmount":    49999,
    "reason":         "Coupon has expired"
  }
}
```

**Rejection reasons:**
- `"Coupon not found"`
- `"Coupon is inactive"`
- `"Coupon has expired"` — `expiryDate < today`
- `"Coupon usage limit reached"` — `usedCount >= usageLimit`

---

### 9. Calculate Fee

**POST** `/admin/internal-plans/calculate-fee`

**Request body:**
```json
{
  "internalPlanId": 1,
  "basePrice":      49999,
  "couponCode":     "WELCOME10"
}
```
`basePrice` is the linked course's `courseFee` (rupees) and is required. `couponCode` is optional.

**Success 200:**
```json
{
  "success": true,
  "data": {
    "basePrice":   49999,
    "discount":    5000,
    "finalAmount": 44999,
    "couponValid": true,
    "breakdown": [
      { "label": "Base Price",          "amount": 49999 },
      { "label": "Coupon (WELCOME10)",  "amount": -5000 },
      { "label": "Total",               "amount": 44999 }
    ]
  }
}
```

---

## Enrollment Integration

When an admin selects an Internal Plan during enrollment, the existing manual enrollment endpoint (`POST /admin/enrollments/manual`) should accept these additional optional fields:

```json
{
  "candidateType":     "INTERNAL",
  "internalPlanId":    1,
  "internalPlanRefId": "iplan_8f3a9b21-7c4d-4e25-b6a1-0f8d2c3e4abc",
  "couponCode":        "WELCOME10",
  "feeBreakdown": {
    "basePrice":   49999,
    "discount":    5000,
    "finalAmount": 44999
  }
}
```

If `internalPlanId` is present, the backend should use `feeBreakdown.finalAmount` (in rupees, not paise) as the enrollment amount instead of the default plan amount.

The `internalPlanRefId` MUST be included in the webhook payload delivered to subscribers — it is the opaque plan identifier external systems use to reconcile enrollments.

### Candidate Type marker

The `candidateType` field (values: `"INTERNAL"` or `"EXTERNAL"`) MUST be persisted on every enrollment record and echoed back on `GET /admin/enrollments` for each row. This is what the admin UI uses to filter the enrollments table by candidate type. Rules:

- `POST /admin/enrollments/manual` — when `candidateType` is present in the body, persist it as-is.
- `POST /admin/enrollments/bulk` — `candidateType` arrives in the multipart `planContext` JSON field; apply it to **every row** the upload creates.
- `POST /enrollments` (public website endpoint) — if the request lacks `candidateType`, default the persisted value to `"EXTERNAL"`.

If the backend cannot yet persist the field, the admin UI also has a fallback classifier that infers candidate type from the presence of `internalPlanId`/`internalPlanRefId` on the returned record. Returning `candidateType` explicitly is preferred.

---

## Status Codes

| Code | Meaning                            |
|------|------------------------------------|
| 200  | Success                            |
| 201  | Created                            |
| 204  | Deleted (no body)                  |
| 400  | Validation error                   |
| 401  | Unauthenticated                    |
| 403  | Forbidden (insufficient permission)|
| 404  | Not found                          |
| 409  | Conflict (plan in use)             |

---

## Permissions Required

| Action             | Permission             |
|--------------------|------------------------|
| View list/detail   | `INTERNAL_PLANS_VIEW`  |
| Create/Update      | `INTERNAL_PLANS_MANAGE`|
| Delete             | `INTERNAL_PLANS_MANAGE`|
| Set status         | `INTERNAL_PLANS_MANAGE`|
| Validate coupon    | `INTERNAL_PLANS_VIEW`  |
| Calculate fee      | `INTERNAL_PLANS_VIEW`  |
