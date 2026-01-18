# AUTH CONTRACT – DO NOT BREAK 🚨

This document defines **non-negotiable authentication invariants** for the FamilyPlate app.
These rules exist to prevent recurring session-cookie regressions (`fp_session missing`).

---

## 🔐 AUTH BRIDGE PATTERN (MANDATORY)

The following flow **MUST ALWAYS EXIST**:

1. User clicks Magic Link
2. User lands on `/auth/verify`
3. `/auth/verify` **redirects to** `/auth/bridge`
4. `/auth/bridge` performs a **POST** request to `/api/auth/establish`
   - `credentials: "include"` is REQUIRED
5. `/api/auth/establish` sets the `fp_session` cookie via **Set-Cookie**
6. User is redirected to the authenticated app (e.g. `/dashboard`)

---

## ✅ REQUIRED ROUTES

The following routes are **critical infrastructure** and MUST NOT be removed:

- `/auth/bridge`
- `/api/auth/establish`

If either route is missing → **AUTH IS BROKEN**.

---

## 🍪 COOKIE RULES (CRITICAL)

- `fp_session` **MUST** be set in a **POST response**
- ❌ Cookies must **NEVER** be set via redirect responses
- Cookie attributes:
  - `HttpOnly: true`
  - `Secure: true` (in production)
  - `SameSite: Lax`
  - `Path: /`
  - ❌ Domain must NOT be hardcoded

Reason:
> Browsers may silently drop cookies set during redirects or cross-navigation timing.

---

## 🧱 MIDDLEWARE REQUIREMENTS

Auth middleware **MUST ALLOWLIST** the following routes:

- `/auth/bridge`
- `/api/auth/establish`
- (optional) `/auth/verify`

Blocking any of these routes will break login.

---

## 🧪 REQUIRED SMOKE TEST (NON-OPTIONAL)

A minimal automated test MUST ensure:

- `/auth/bridge` returns `200`
- `POST /api/auth/establish` returns `200`
- Response contains `Set-Cookie: fp_session=...`

If this test fails:
➡️ **Authentication is broken**
➡️ The PR MUST NOT be merged

---

## 🚫 WHAT THIS IS NOT

- ❌ Not a refactor target
- ❌ Not an optimization candidate
- ❌ Not optional
- ❌ Not feature code

This is **infrastructure**.

---

## 🧠 RULE OF THUMB

> If you are touching auth, routing, middleware, or redirects,
> and you are unsure whether this flow is preserved:
>
> **STOP. CHECK THIS FILE.**

---

**Violating this contract is a BUG, not a refactor.**
