# Zeouf BRD-to-automation pilot

This records the 2026-10-05 AUTH-02 pilot. See the [current case and automation status](../specs/ecommerce/requirements/AUTOMATION_STATUS.md) for the expanded inventory and later executions.

## Inputs and boundary

- Application: `https://zeouf-luxury-fashion-ecommerce.vercel.app/`
- Requirements: Zeouf `docs/BRD.md` version 1.5, dated 2026-10-02, plus `docs/QA_TESTING_GUIDE.md` from the separate Zeouf source repository.
- Browser project and seed: `ecommerce-chromium` and `tests/ecommerce/seed.spec.ts`.
- Execution date: 2026-10-05. The deployed build revision, Supabase mode, and applied database migration were not established by this browser pilot.
- Safety boundary: public-site browser validation only. Both generated tests block all non-read HTTP requests and fail if one is attempted. No account, order, review, payment, reset, or fixture mutation was attempted.

The BRD defines 29 P0 requirements. This pilot selected AUTH-02 because its rejection behavior can be exercised safely on the public deployment. It is a sample of the proposed workflow, not a claim of complete P0 or AUTH-02 coverage.

## Requirement-to-case-to-automation record

| Requirement                   | Test case      | BRD expectation checked                                                                      | Automation                                                                    | Execution                    |
| ----------------------------- | -------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| AUTH-02 (P0; historical G-01) | TC-AUTH-002-01 | Different password and confirmation show a mismatch alert before an account-creation request | [Mismatch test](../tests/ecommerce/auth-confirmation-mismatch.spec.ts)        | Passed, Chromium, 2026-10-05 |
| AUTH-02 (P0; historical G-01) | TC-AUTH-002-02 | Blank confirmation is required and prevents an account-creation request                      | [Blank confirmation test](../tests/ecommerce/auth-confirmation-blank.spec.ts) | Passed, Chromium, 2026-10-05 |

The [test plan](../specs/ecommerce/04-brd-auth-confirmation.md) contains the steps and expected results. Both tests use `fixtures/ecommerce-base`, the storefront page object, a fresh browser context, and a network route that aborts non-read requests. The Playwright run reported **2 passed**. The browser planner also observed the mismatch alert and no signup request before test generation.

## Evidence boundaries for account tests

The following commands belong to the **separate Zeouf website repository**, not this Playwright framework. In this repository, `npm run test:ui` runs the older practice-site browser projects, and there is no `test:live` script. The generated pilot cases run with `--project=ecommerce-chromium`.

| Zeouf website command or setup           | What it establishes                                                                                                                          | What it does not establish                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run test:ui`                        | Local registration form validation and payload behavior with `/api/dev/create-user` mocked                                                   | Real signup, confirmation email delivery, or inbox/link completion                         |
| `npm run test:live`                      | Deployed browsing checks; its test guard aborts non-GET/HEAD/OPTIONS requests and protected helper routes, and fails if a write is attempted | Signup, checkout mutation, or email delivery                                               |
| Nonproduction `POST /api/test/seed-user` | Creates or updates an already confirmed test account for login/setup when its secret and service role are configured                         | Registration confirmation or email delivery; it can reset an existing test user's password |

Zeouf's registration UI attempts `/api/dev/create-user` first and falls back to Supabase `signUp` if that helper fails. The helper creates an already confirmed user without a confirmation email and is disabled when `NODE_ENV=production`. A registration test must record which path executed before claiming what it proves. Evidence of the email path requires the real signup branch, a controlled inbox, delivery and link verification, and a checked account state.

State-changing cases belong on a separate staging site **and** Supabase project with disposable accounts and scoped cleanup. The runtime must permit the intended test setup; merely naming a production-mode preview deployment “staging” does not enable the nonproduction helpers. The current reset endpoint omits some records and ignores some deletion failures, so cleanup must be verified. Keep public production checks read-only.

## What this pilot could not establish

- **AUTH-02 remains partly covered.** Matching-password registration, confirmation omission from the provider payload, and clearing confirmation after success or switching tabs were not verified. A safe isolated account fixture or request mock is needed for the successful path.
- **The other 28 P0 requirements were not evaluated here:** PDP-03, CUR-03, AUTH-03, AUTH-06, FAV-02, CART-01, CART-04, CHK-01, CHK-03, CHK-05, CHK-06, CHK-07, CHK-09, ORD-01, REV-04, RST-04, ADM-01, ADM-02, ADM-03, PRD-03, STK-01, STK-02, STK-04, AOR-01, AOR-04, OPS-02, NFR-01, and NFR-02. Existing Zeouf tests may touch some of these behaviors, but they are not yet linked to the BRD and were not counted as verified requirement coverage.
- **Authenticated and database behavior needs a controlled deployment.** The public site does not provide disposable confirmed users, admin credentials, reliable reset/cleanup, or database evidence for checkout, ownership, stock, moderation, and security acceptance. `seed-user` can prepare a confirmed account, but it cannot prove email confirmation. The Zeouf QA guide explicitly warns that its reset endpoint is not a guaranteed clean baseline.
- **Change-aware maintenance and healing were not exercised.** There was no application code or BRD change in this pilot. This repository currently has agent instructions for manual planning, generation, and repair, but no automatic source-diff trigger, maintained requirement manifest, verified update proposal, or measured healing outcome.

Next safe public slice: add a requirement-linked CART-01 guest-denial case that also proves the cart remains empty, then test CART-04 browser-cart recovery in an isolated browser context. The first controlled-deployment slice should cover successful AUTH-02/03 registration and sign-in with fixture cleanup before attempting checkout and ownership assertions.
