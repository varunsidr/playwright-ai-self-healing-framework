# TC-AUTH-04-CORE password visibility and tabs

## Application Overview

Zeouf BRD AUTH-04 P1, BRD v1.5 website commit 481a090. Public read-only, ecommerce-chromium, fresh guest context. Fictional password only; no sign-in/registration submission, no data cleanup.

## Test Scenarios

### 1. Account panel input state

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. TC-AUTH-04-CORE password visibility and tabs preserve entered value

**File:** `tests/ecommerce/auth-password-visibility.spec.ts`

**Automation:** [auth-password-visibility.spec.ts](../../tests/ecommerce/auth-password-visibility.spec.ts). Run with `npx playwright test --project=ecommerce-chromium tests/ecommerce/auth-password-visibility.spec.ts`. Passed on the public deployment on 2026-10-07. The form was never submitted.

**Steps:**
  1. Install context-wide non-read guard, open home and Account.
    - expect: Sign In tab and password input are visible; input type is password.
  2. Fill fictional password and click visibility button.
    - expect: Login input type changes to text while entered value is retained.
  3. Switch to Register tab.
    - expect: Registration form is visible, shared password value remains, and confirmation is blank.
  4. Click registration password visibility button.
    - expect: Type becomes password while value remains.
  5. Switch back to Sign In, then check write attempts.
    - expect: Sign In remains operable and no non-read request was attempted.
