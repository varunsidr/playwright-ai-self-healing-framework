# Zeouf BRD pilot: AUTH-02 registration confirmation

## Generated automation and execution

| Case                                    | Script                                                                                         | Result on 2026-10-05               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------- |
| TC-AUTH-002-01: mismatched confirmation | [auth-confirmation-mismatch.spec.ts](../../tests/ecommerce/auth-confirmation-mismatch.spec.ts) | Passed on deployed Zeouf, Chromium |
| TC-AUTH-002-02: blank confirmation      | [auth-confirmation-blank.spec.ts](../../tests/ecommerce/auth-confirmation-blank.spec.ts)       | Passed on deployed Zeouf, Chromium |

Run both cases from the repository root:

```powershell
npx.cmd playwright test tests/ecommerce/auth-confirmation-mismatch.spec.ts tests/ecommerce/auth-confirmation-blank.spec.ts --project=ecommerce-chromium
```

Both tests abort any attempted non-read HTTP request before it can reach the public site and fail if one is attempted. The remaining AUTH-02 criteria and the wider P0 coverage status are recorded in [the pilot report](../../docs/zeouf-brd-pilot.md).

## Application Overview

Source: Zeouf docs/BRD.md v1.5 requirement AUTH-02 (P0, implemented) and docs/QA_TESTING_GUIDE.md sections 1-2. Target: deployed Zeouf storefront, ecommerce-chromium, tests/ecommerce/seed.spec.ts. Public deployment allows validation-only tests; account creation is outside this pilot. The BRD's historical G-01 is resolved in source but remains a regression risk. The planner observed the registration form, a mismatch alert, and no auth/signup network request after mismatched input on 2026-10-05. Each case starts in a fresh browser context.

## Test Scenarios

### 1. AUTH-02 registration confirmation

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. AUTH-02 rejects mismatched confirmation before signup

**File:** `tests/ecommerce/auth-confirmation-mismatch.spec.ts`

**Steps:**

1. Open the Zeouf homepage and the account Register tab in a fresh visitor context. - expect: Register form shows full name, email, password, and confirm password fields.
2. Enter fictional name and email, a valid-looking password, and a different confirmation. - expect: No account or order is created.
3. Submit Register while recording any signup or development-user network requests. - expect: A visible alert explains that passwords do not match. - expect: The register panel stays open. - expect: No signup or development-user request is sent.

#### 1.2. AUTH-02 requires a nonblank confirmation

**File:** `tests/ecommerce/auth-confirmation-blank.spec.ts`

**Steps:**

1. Open the Zeouf homepage and Register tab in a fresh visitor context. - expect: Confirmation field is present.
2. Enter fictional name, email, and password; leave confirmation empty and submit. - expect: Registration does not create an account or send a signup request. - expect: The form remains open and a required-field or mismatch validation is visible.
