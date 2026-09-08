# Specs

This directory holds human-readable test plans and guidance for adding new automated specs.

Guidelines:

- **Purpose:** store test plans, acceptance criteria, and links to automated specs in `../tests/`.
- **Authoring a plan:** create a markdown file named `NN-description.md` with the following short template:

```md
# Title

- **Area:** inputs | home | api
- **Purpose:** One-sentence description of the behavior to cover
- **Preconditions:** what the environment needs (logged in, data seeded)
- **Steps:** numbered scenario steps
- **Expected:** expected outcome per step
- **Automated spec:** relative path to the automated spec (if implemented)
```

- **Linking:** when you add/modify an automated spec in `tests/`, add or update the corresponding plan here to keep the intent documented.

Example:

```md
# Inputs page: basic form

- **Area:** inputs
- **Purpose:** verify the inputs demo accepts and displays values correctly
- **Preconditions:** none
- **Steps:** 1) Navigate to inputs page 2) Fill form 3) Submit
- **Expected:** values displayed in result area
- **Automated spec:** ../tests/demo-inputs.spec.ts
```

Keeping a short test plan alongside automated specs helps reviewers understand test intent and makes PRs easier to review.
