# Specs

This directory holds human-readable test plans and guidance for adding new automated specs.

New plans for the Playwright planner, generator, and healer belong in `ecommerce/` and cover the zeouf fashion storefront. Use `../tests/ecommerce/seed.spec.ts` with Playwright project `ecommerce-chromium`; the storefront runs at `ECOMMERCE_BASE_URL` (default `http://localhost:3000`). The older Inputs plans in this directory are historical examples and are outside the agents' current scope.

Guidelines:

- **Purpose:** store storefront test plans, acceptance criteria, and links to automated specs in `../tests/ecommerce/`.
- **Authoring a plan:** create a markdown file named `NN-description.md` with the following short template:

```md
# Title

- **Area:** catalog | product | account | checkout
- **Purpose:** One-sentence description of the behavior to cover
- **Preconditions:** what the environment needs (logged in, data seeded)
- **Steps:** numbered scenario steps
- **Expected:** expected outcome per step
- **Seed:** ../../tests/ecommerce/seed.spec.ts
- **Automated spec:** Markdown link to the `.spec.ts` file (if implemented)
- **Run:** exact Playwright command for that file and the `ecommerce-chromium` project (if implemented)
```

- **Linking:** when you add/modify an automated spec in `tests/ecommerce/`, update its plan with a clickable script link and an exact command to run that file. Keep the runnable code in `.spec.ts` so reviewers see the same source Playwright executes.

Example:

```md
# Fashion storefront: product listing

- **Area:** catalog
- **Purpose:** verify shoppers can view products in a collection
- **Preconditions:** none
- **Steps:** 1) Open a collection 2) Wait for its products to load
- **Expected:** collection heading and product cards are visible
- **Seed:** ../../tests/ecommerce/seed.spec.ts
- **Automated spec:** [catalog.spec.ts](../../tests/ecommerce/catalog.spec.ts)
- **Run:** `npx.cmd playwright test tests/ecommerce/catalog.spec.ts --project=ecommerce-chromium`
```

Keeping a short test plan alongside automated specs helps reviewers understand test intent and makes PRs easier to review.
